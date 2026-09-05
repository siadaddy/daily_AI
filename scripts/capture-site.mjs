/**
 * 배포된 사이트를 그대로 캡처해 Supabase 스토리지에 올린다.
 *
 * 왜 GitHub Actions인가: Vercel 서버리스에 Chromium을 올리면 번들 용량과
 * 콜드스타트가 부담이다. 파이프라인은 이미 매일 Actions에서 돌고 스토리지에
 * 업로드하므로 여기 붙이는 편이 싸고 안정적이다.
 *
 * 왜 통짜가 아닌가: 실측으로 전체 페이지가 모바일 9,048px / 데스크톱 5,866px다.
 * 네이버에 올려도 읽을 수 없어 [data-capture] 단위로 쪼갠다 (223~2,033px).
 *
 * 사용: node scripts/capture-site.mjs [YYYY-MM-DD] [--dry [출력경로]]
 *   --dry 는 업로드 없이 로컬에 저장한다 (선택자·크기 확인용).
 * 필요 환경변수: SITE_URL, 그리고 --dry가 아니면 SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BUCKET = 'card-images'
const VIEWPORTS = [
  { name: 'mobile', width: 390 },
  { name: 'desktop', width: 1280 },
]

const SITE_URL = (process.env.SITE_URL ?? '').replace(/\/$/, '')
const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function today() {
  // 파이프라인과 같은 KST 기준
  const kst = new Date(Date.now() + 9 * 3600 * 1000)
  return kst.toISOString().slice(0, 10)
}

const DRY = process.argv.includes('--dry')
const DRY_DIR =
  process.argv[process.argv.indexOf('--dry') + 1]?.startsWith('-') === false
    ? process.argv[process.argv.indexOf('--dry') + 1]
    : '.capture-out'

async function upload(objectPath, body, contentType) {
  if (DRY) {
    const out = path.join(DRY_DIR, objectPath)
    await mkdir(path.dirname(out), { recursive: true })
    await writeFile(out, body)
    return out
  }
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      // 같은 날 재실행 시 덮어쓴다
      'x-upsert': 'true',
    },
    body,
  })
  if (!res.ok) {
    throw new Error(`업로드 실패 ${objectPath}: ${res.status} ${await res.text()}`)
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

async function main() {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(process.argv[2] ?? '')
    ? process.argv[2]
    : today()
  const required = DRY
    ? { SITE_URL }
    : { SITE_URL, SUPABASE_URL, SERVICE_KEY }
  for (const [k, v] of Object.entries(required)) {
    if (!v) throw new Error(`환경변수 누락: ${k}`)
  }
  if (DRY) console.log(`[dry-run] 업로드 없이 ${DRY_DIR} 에 저장한다`)

  const target = `${SITE_URL}/news/${date}`
  console.log(`캡처 대상: ${target}`)

  const browser = await chromium.launch()
  const shots = []

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: 900 },
        // 2x는 네이버 업로드엔 과하고 용량만 두 배가 된다
        deviceScaleFactor: 1,
      })
      await page.goto(target, { waitUntil: 'networkidle', timeout: 60_000 })

      // 고정 상단바(헤더·탭·시세·날짜)를 숨긴다.
      // 요소 캡처는 대상을 화면에 스크롤해 넣는데, sticky 크롬이 그 위를 덮어
      // 카드 사진 윗부분이 잘려 나온다. 여기서 담는 건 콘텐츠지 크롬이 아니다.
      // 캡처 대상에 여백을 준다. 블로그에 올렸을 때 콘텐츠가 이미지 가장자리에
      // 붙어 있으면 답답해 보인다. 요소 단위로 따로 뜨므로 이 여백이 페이지
      // 레이아웃을 망가뜨릴 일은 없다.
      await page.addStyleTag({
        content: `
          .top-bar-fixed, .sticky-nav-bar { display: none !important; }
          [data-capture] {
            padding: 20px !important;
            background: var(--bg) !important;
          }
        `,
      })

      // 스크롤 진입 애니메이션(whileInView)이 끝나야 요소가 보인다
      await page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight)
      )
      await page.waitForTimeout(1200)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(400)

      const nodes = page.locator('[data-capture]')
      const count = await nodes.count()
      if (count === 0) throw new Error(`[data-capture] 요소가 없다 (${vp.name})`)

      for (let i = 0; i < count; i++) {
        const node = nodes.nth(i)
        const key = await node.getAttribute('data-capture')
        const box = await node.boundingBox()
        if (!box || box.height < 40) continue

        const buf = await node.screenshot({ type: 'png' })
        const objectPath = `screens/${date}/${vp.name}-${key}.png`
        const url = await upload(objectPath, buf, 'image/png')
        shots.push({
          key,
          viewport: vp.name,
          width: Math.round(box.width),
          height: Math.round(box.height),
          bytes: buf.length,
          url,
        })
        console.log(
          `  ${vp.name}/${key}  ${Math.round(box.width)}x${Math.round(box.height)}  ${Math.round(buf.length / 1024)}KB`
        )
      }
      await page.close()
    }

    // 페이지가 어떤 캡처가 있는지 알아야 하므로 목록을 함께 올린다
    const manifest = { date, capturedAt: new Date().toISOString(), shots }
    await upload(
      `screens/${date}/manifest.json`,
      JSON.stringify(manifest, null, 2),
      'application/json'
    )
    console.log(`\n총 ${shots.length}장 업로드 완료`)
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
