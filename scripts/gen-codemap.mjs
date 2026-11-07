#!/usr/bin/env node
/**
 * 코드맵 생성기 — docs/CODEMAP.md 를 코드에서 직접 뽑아 만든다.
 *
 *   npm run codemap            # 재생성 (내용이 바뀐 경우에만 파일을 쓰고 한 줄 보고)
 *   npm run codemap -- --verbose   # 설명이 없는 파일 목록도 출력
 *
 * - 읽기 전용(코드를 건드리지 않음), 의존성 추가 없음(typescript 는 이미 devDependency).
 * - 출력은 결정적: 정렬 고정, 타임스탬프 없음, 줄 수는 반올림 → 같은 코드면 같은 바이트.
 * - 사람이 쓰는 부분(설명·작업표·주의사항)은 scripts/codemap-notes.json 에만 둔다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_REL = 'docs/CODEMAP.md'
const VERBOSE = process.argv.includes('--verbose')

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '__pycache__',
  'output',
  '.vercel',
  'coverage',
])

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(ROOT, rel))
const uniq = (a) => [...new Set(a)].sort()

function walk(relDir, accept) {
  const abs = path.join(ROOT, relDir)
  if (!fs.existsSync(abs)) return []
  const out = []
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name) || ent.name === '.DS_Store') continue
    const rel = `${relDir}/${ent.name}`
    if (ent.isDirectory()) out.push(...walk(rel, accept))
    else if (accept(rel)) out.push(rel)
  }
  return out.sort()
}

const notes = JSON.parse(read('scripts/codemap-notes.json'))
const noteOf = (rel) => notes.files?.[rel] ?? ''

/** 줄 수는 편집마다 흔들려 diff 소음이 되므로 반올림한다. */
function approx(n) {
  const r = n < 100 ? Math.round(n / 10) * 10 : Math.round(n / 50) * 50
  return `≈${Math.max(r, 10)}`
}

const shortTs = (rel) =>
  rel
    .replace(/^src\//, '')
    .replace(/\.(tsx?|mjs)$/, '')
    .replace(/\/index$/, '')

// ───────────────────────── TypeScript ─────────────────────────

const tsFiles = walk('src', (r) => /\.(ts|tsx)$/.test(r) && !r.endsWith('.d.ts'))
const tsSet = new Set(tsFiles)

function resolveImport(fromRel, spec) {
  let base
  if (spec.startsWith('@/')) base = `src/${spec.slice(2)}`
  else if (spec.startsWith('.'))
    base = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec))
  else return null
  for (const c of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`])
    if (tsSet.has(c)) return c
  return null
}

const NEXT_CONVENTION = new Set([
  'revalidate',
  'dynamic',
  'maxDuration',
  'metadata',
  'viewport',
  'generateMetadata',
  'generateStaticParams',
  'config',
  'runtime',
  'size',
  'contentType',
  'alt',
])

/** .from('t') 뒤에 이어지는 메서드로 읽기/쓰기를 구분한다. */
function dbOpsTs(text) {
  const r = new Set()
  const w = new Set()
  const re = /\.from\(\s*['"`](\w+)['"`]\s*\)\s*(?:\.(\w+))?/g
  let m
  while ((m = re.exec(text))) {
    if (/storage\s*$/.test(text.slice(Math.max(0, m.index - 12), m.index))) continue
    ;(/^(insert|upsert|update|delete)$/.test(m[2] ?? '') ? w : r).add(m[1])
  }
  return { r: [...r].sort(), w: [...w].sort() }
}

function storageBucket(text) {
  if (!/storage\/v1\//.test(text)) return ''
  return text.match(/BUCKET\s*=\s*['"]([\w-]+)['"]/)?.[1] ?? '?'
}

const HOST_IGNORE = /^(localhost|www\.w3\.org|schema\.org|example\.\w+|json-schema\.org)$/

function analyzeTs(rel) {
  const text = read(rel)
  const sf = ts.createSourceFile(
    rel,
    text,
    ts.ScriptTarget.Latest,
    true,
    rel.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const exports = []
  const types = []
  const imports = []
  let directive = ''
  for (const st of sf.statements) {
    if (ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression)) {
      if (/^use (client|server)$/.test(st.expression.text)) directive = st.expression.text.slice(4)
      continue
    }
    if (ts.isImportDeclaration(st)) {
      imports.push(st.moduleSpecifier.text)
      continue
    }
    if (ts.isExportAssignment(st)) {
      exports.push('default')
      continue
    }
    if (ts.isExportDeclaration(st)) {
      if (st.exportClause && ts.isNamedExports(st.exportClause))
        for (const e of st.exportClause.elements) exports.push(e.name.text)
      else if (!st.exportClause) exports.push('*')
      if (st.moduleSpecifier) imports.push(st.moduleSpecifier.text)
      continue
    }
    const mods = ts.canHaveModifiers(st) ? (ts.getModifiers(st) ?? []) : []
    if (!mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue
    const isDefault = mods.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st))
      exports.push(isDefault ? 'default' : (st.name?.text ?? 'default'))
    else if (ts.isVariableStatement(st))
      for (const d of st.declarationList.declarations)
        if (ts.isIdentifier(d.name)) exports.push(d.name.text)
    if (
      ts.isInterfaceDeclaration(st) ||
      ts.isTypeAliasDeclaration(st) ||
      ts.isEnumDeclaration(st)
    )
      types.push(st.name.text)
  }

  const internal = uniq(
    imports.map((s) => resolveImport(rel, s)).filter((p) => p && p !== rel)
  )
  const revalidateRoute = text.match(/export const revalidate\s*=\s*(\d+)/)?.[1] ?? ''
  const cacheSecs = uniq(
    [...text.matchAll(/revalidate:\s*(\d+)/g)].map((m) => m[1])
  )
  const channels = text.includes('.channel(')
    ? uniq([...text.matchAll(/table:\s*['"](\w+)['"]/g)].map((m) => m[1]))
    : null
  return {
    rel,
    lines: text.split('\n').length,
    directive,
    exports,
    types: types.sort(),
    internal,
    db: dbOpsTs(text),
    bucket: storageBucket(text),
    cache: text.includes('unstable_cache') ? cacheSecs : null,
    revalidateRoute,
    ssg: /export (async )?function generateStaticParams/.test(text),
    swr: /\buseSWR\b/.test(text),
    apiCalls: uniq([...text.matchAll(/['"`](\/api\/[a-z0-9\-/]+)/g)].map((m) => m[1].replace(/\/$/, ''))),
    channels,
    admin: /createAdminClient\(/.test(text),
    capture: (text.match(/data-capture=/g) ?? []).length,
    hosts: uniq(
      [...text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)]
        .map((m) => m[1].toLowerCase())
        .filter((h) => !HOST_IGNORE.test(h))
    ),
    env: uniq(
      [...text.matchAll(/process\.env\.(\w+)/g)]
        .map((m) => m[1])
        .filter((e) => !/^(NEXT_PUBLIC_|NODE_ENV$|VERCEL)/.test(e))
    ),
    isTest: /\.test\.tsx?$/.test(rel),
  }
}

const tsInfos = tsFiles.map(analyzeTs)

// 역참조(누가 이 파일을 import 하는가) — 테스트 파일은 제외
const usedBy = new Map()
for (const i of tsInfos) {
  if (i.isTest) continue
  for (const dep of i.internal) {
    if (!usedBy.has(dep)) usedBy.set(dep, [])
    usedBy.get(dep).push(i.rel)
  }
}

// ───────────────────────── Python ─────────────────────────

const pyFiles = [
  ...walk('pipeline', (r) => r.endsWith('.py')),
  ...walk('ai-crew', (r) => r.endsWith('.py')),
].filter((r) => !r.endsWith('__init__.py'))

function analyzePy(rel) {
  const text = read(rel)
  const defs = [...text.matchAll(/^(?:async\s+)?def\s+(\w+)|^class\s+(\w+)/gm)].map(
    (m) => m[1] ?? m[2]
  )
  const pub = defs.filter((d) => !d.startsWith('_'))
  const priv = defs.length - pub.length

  const r = new Set()
  const w = new Set()
  for (const m of text.matchAll(/\.table\(\s*["'](\w+)["']\s*\)\s*\.(\w+)/g))
    (/^(insert|upsert|update|delete)$/.test(m[2]) ? w : r).add(m[1])
  for (const m of text.matchAll(/rest\/v1\/(\w+)/g)) {
    const before = text.slice(Math.max(0, m.index - 200), m.index)
    const method = [...before.matchAll(/(?:requests|_req)\.(get|post|patch|put|delete)\(/g)].pop()?.[1]
    ;(method && method !== 'get' ? w : r).add(m[1])
  }
  const uses = new Set()
  for (const m of text.matchAll(/^[ \t]*from\s+((?:agents|utils)[\w.]*)\s+import\s+([^\n#]+)/gm)) {
    if (m[1] === 'agents' || m[1] === 'utils')
      for (const n of m[2].replace(/[()]/g, '').split(',')) uses.add(`${m[1]}.${n.trim().split(' ')[0]}`)
    else uses.add(m[1])
  }
  for (const m of text.matchAll(/^[ \t]*import\s+((?:agents|utils)[\w.]*)/gm)) uses.add(m[1])

  const selfMod = rel.split('/').slice(1).join('.').replace(/\.py$/, '')
  uses.delete(selfMod)
  return {
    rel,
    lines: text.split('\n').length,
    pub,
    priv,
    db: { r: [...r].sort(), w: [...w].sort() },
    bucket: storageBucket(text),
    uses: [...uses].sort(),
    env: uniq(
      [...text.matchAll(/os\.(?:getenv|environ\.get)\(\s*["'](\w+)["']|os\.environ\[\s*["'](\w+)["']\]/g)].map(
        (m) => m[1] ?? m[2]
      )
    ),
    hosts: uniq(
      [...text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)]
        .map((m) => m[1].toLowerCase())
        .filter((h) => !HOST_IGNORE.test(h))
    ),
  }
}
const pyInfos = pyFiles.map(analyzePy)

// scripts/*.mjs (capture-site 등) 도 같은 방식으로 DB/버킷만 뽑는다
const scriptFiles = walk('scripts', (r) => /\.(mjs|js|ts)$/.test(r) && !r.endsWith('gen-codemap.mjs'))
const scriptInfos = scriptFiles.map((rel) => {
  const text = read(rel)
  return {
    rel,
    lines: text.split('\n').length,
    db: dbOpsTs(text),
    bucket: storageBucket(text),
    env: uniq(
      [...text.matchAll(/process\.env\.(\w+)/g)].map((m) => m[1])
    ),
  }
})

// ───────────────────────── 포맷 ─────────────────────────

const missing = []

function line(parts) {
  return parts.filter(Boolean).join(' · ')
}

function dbStr(db, bucket) {
  const p = []
  if (db.r.length) p.push(`r:${db.r.join(',')}`)
  if (db.w.length) p.push(`w:${db.w.join(',')}`)
  if (bucket) p.push(`storage:${bucket}`)
  return p.length ? `db ${p.join(' ')}` : ''
}

const NOISE_IMPORTS = new Set([
  'lib/types',
  'lib/site-url',
  'lib/dates',
  'components/layout/Footer',
  'components/layout/SiteShell',
  'components/layout/PageHeader',
])

function tsFlags(i, { withImports = true, withUsedBy = false } = {}) {
  const dir = path.posix.dirname(shortTs(i.rel))
  const isComp = i.rel.startsWith('src/components/')
  const imps = i.internal
    .map(shortTs)
    .filter((s) => !NOISE_IMPORTS.has(s))
    // 컴포넌트는 같은 폴더 형제 import 를 생략(폴더 목록으로 충분)
    .filter((s) => !(isComp && path.posix.dirname(s) === dir))
  const ub = usedBy.get(i.rel) ?? []
  const base = path.posix.basename(i.rel).replace(/\.tsx?$/, '')
  let exp = i.exports.filter((e) => !NEXT_CONVENTION.has(e) && e !== 'default')
  // 파일명과 같은 단일 export(컴포넌트)는 정보가 없으므로 생략
  if (exp.length === 1 && exp[0] === base) exp = []
  if (exp.length > 8) exp = [...exp.slice(0, 8), `+${exp.length - 8}`]
  return [
    i.directive ? i.directive : '',
    i.revalidateRoute ? `rev=${i.revalidateRoute}` : '',
    i.ssg ? 'SSG' : '',
    exp.length ? `exports ${exp.join(', ')}` : '',
    dbStr(i.db, i.bucket),
    i.admin ? 'ADMIN-client' : '',
    i.cache ? `cache${i.cache.length ? ' ' + i.cache.join('/') + 's' : ''}` : '',
    i.swr ? 'swr' : '',
    i.channels ? `realtime ${i.channels.join(',') || '?'}` : '',
    i.apiCalls.length ? `fetch ${i.apiCalls.join(',')}` : '',
    i.hosts.length ? `ext ${i.hosts.join(',')}` : '',
    i.env.length ? `env ${i.env.join(',')}` : '',
    i.capture ? `data-capture×${i.capture}` : '',
    withImports && imps.length ? `→ ${imps.join(', ')}` : '',
    withUsedBy && ub.length
      ? `← ${ub.slice(0, 3).map(shortTs).join(', ')}${ub.length > 3 ? ` +${ub.length - 3}` : ''}`
      : '',
  ]
}

function tsLine(i, label, opts) {
  const note = noteOf(i.rel)
  if (!note) missing.push(i.rel)
  const name = label ?? shortTs(i.rel)
  return `- \`${name}\` ${approx(i.lines)}${note ? ` — ${note}` : ''}${(() => {
    const f = line(tsFlags(i, opts))
    return f ? ` | ${f}` : ''
  })()}`
}

const out = []
const push = (...s) => out.push(...s)

// ── 헤더 ──
push(
  '# CODEMAP',
  '',
  '> **자동 생성 파일 — 직접 수정 금지.** `npm run codemap` 으로 재생성 (Stop 훅이 자동 실행). 설명·작업표는 `scripts/codemap-notes.json` 에서 고친다.',
  '> **읽는 법: 통째로 읽지 말 것.** 먼저 §0(파일 앞쪽 약 45줄)만 읽고, 필요한 섹션은 `grep -n "^## " docs/CODEMAP.md` 로 위치를 찾아 `offset/limit` 으로 읽는다.',
  '> 줄 수(≈)는 반올림값. `→` 내부 import · `←` 이 파일을 쓰는 곳 · `r:`/`w:` Supabase 읽기/쓰기 · `rev` 라우트 revalidate(초) · `cache` unstable_cache(초).',
  '',
  notes.intro ?? '',
  '',
  '## 0. 작업 → 먼저 볼 파일',
  '',
  '| 작업 | 진입 파일 |',
  '|---|---|',
  ...(notes.tasks ?? []).map(([a, b]) => `| ${a} | ${b} |`),
  '',
  '### 주의사항 (코드만 봐서는 놓치기 쉬운 것)',
  '',
  ...(notes.gotchas ?? []).map((g) => `- ${g}`),
  ''
)

// ── 1. app ──
const appFiles = tsInfos.filter((i) => i.rel.startsWith('src/app/') && !i.isTest)
const routeOf = (rel) => {
  const r = rel.replace(/^src\/app/, '').replace(/\/(page|route)\.tsx?$/, '')
  return r === '' ? '/' : r
}
const pages = appFiles.filter((i) => /\/page\.tsx$/.test(i.rel))
const routes = appFiles.filter((i) => /\/route\.tsx?$/.test(i.rel))
const actions = appFiles.filter((i) => i.rel.startsWith('src/app/actions/'))
const specials = appFiles.filter(
  (i) => !pages.includes(i) && !routes.includes(i) && !actions.includes(i)
)

push('## 1. 라우트 (`src/app`)', '', '### 페이지')
for (const i of pages) push(tsLine(i, routeOf(i.rel)))
push('', '### Route Handlers (외부 API는 서버에서 프록시)')
for (const i of routes) push(tsLine(i, routeOf(i.rel)))
push('', '### Server Actions (`app/actions`)')
for (const i of actions) push(tsLine(i))
push('', '### 레이아웃·SEO·특수 파일')
for (const i of specials) push(tsLine(i, undefined, { withImports: false }))
push('')

// ── 2. lib / store / proxy ──
const libFiles = tsInfos.filter(
  (i) => (i.rel.startsWith('src/lib/') || i.rel.startsWith('src/store/') || i.rel === 'src/proxy.ts') && !i.isTest
)
push('## 2. `src/lib` · `store` · `proxy`', '')
{
  const groups = new Map()
  for (const i of libFiles) {
    const parts = i.rel.split('/')
    const g = parts.length > 3 ? parts.slice(1, -1).join('/') : parts.length === 3 ? parts[1] : 'src'
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(i)
  }
  for (const g of [...groups.keys()].sort()) {
    push('', `**${g}/**${notes.dirs?.[`src/${g}`] ? ` — ${notes.dirs[`src/${g}`]}` : ''}`)
    for (const i of groups.get(g)) {
      push(tsLine(i, path.posix.basename(i.rel), { withUsedBy: true }))
      if (notes.listTypesIn?.includes(i.rel)) push(`  - types: ${i.types.join(', ')}`)
    }
  }
}
push('')

// ── 3. components ──
const compFiles = tsInfos.filter((i) => i.rel.startsWith('src/components/') && !i.isTest)
push('## 3. `src/components`', '')
{
  const groups = new Map()
  for (const i of compFiles) {
    const d = i.rel.split('/')[2]
    if (!groups.has(d)) groups.set(d, [])
    groups.get(d).push(i)
  }
  for (const d of [...groups.keys()].sort()) {
    const files = groups.get(d)
    const dirKey = `src/components/${d}`
    push('', `**${d}/**${notes.dirs?.[dirKey] ? ` — ${notes.dirs[dirKey]}` : ''}`)
    if (notes.compactDirs?.includes(dirKey)) {
      const names = files.map((i) => path.posix.basename(i.rel).replace(/\.tsx?$/, ''))
      const api = uniq(files.flatMap((i) => i.apiCalls))
      const dbs = uniq(files.flatMap((i) => [...i.db.r, ...i.db.w]))
      push(
        `- ${names.join(', ')}${api.length ? ` | fetch ${api.join(',')}` : ''}${dbs.length ? ` | db ${dbs.join(',')}` : ''}`
      )
      for (const i of files) if (!noteOf(i.rel) && !notes.dirs?.[dirKey]) missing.push(i.rel)
    } else {
      for (const i of files) push(tsLine(i, path.posix.basename(i.rel)))
    }
  }
}
push('')

// ── 4. 테이블 역색인 ──
{
  const idx = new Map()
  const add = (t, kind, who) => {
    if (!idx.has(t)) idx.set(t, { r: new Set(), w: new Set() })
    idx.get(t)[kind].add(who)
  }
  for (const i of tsInfos) {
    if (i.isTest) continue
    for (const t of i.db.r) add(t, 'r', shortTs(i.rel))
    for (const t of i.db.w) add(t, 'w', shortTs(i.rel))
  }
  for (const i of pyInfos) {
    for (const t of i.db.r) add(t, 'r', i.rel)
    for (const t of i.db.w) add(t, 'w', i.rel)
  }
  for (const t of Object.keys(notes.tables ?? {})) if (!idx.has(t)) idx.set(t, { r: new Set(), w: new Set() })
  push('## 4. Supabase 테이블 역색인 (누가 읽고/쓰는가)', '')
  push('| 테이블 | 읽기 | 쓰기 | 비고 |', '|---|---|---|---|')
  for (const t of [...idx.keys()].sort()) {
    const { r, w } = idx.get(t)
    push(
      `| \`${t}\` | ${[...r].sort().join(', ') || '—'} | ${[...w].sort().join(', ') || '—'} | ${notes.tables?.[t] ?? ''} |`
    )
  }
  push(
    '',
    '_Python 쪽 REST 호출의 읽기/쓰기는 `requests.<method>` 로 추정한 값이다. Storage 버킷은 각 파일 줄의 `storage:` 참고._',
    ''
  )
}

// ── 5. 캐시 · 실시간 · SWR ──
{
  const caches = tsInfos.filter((i) => i.cache && !i.isTest)
  const rts = tsInfos.filter((i) => i.channels && !i.isTest)
  const swrs = tsInfos.filter((i) => i.swr && !i.isTest)
  const revs = tsInfos.filter((i) => i.revalidateRoute && !i.isTest)
  push('## 5. 데이터 가져오기 방식 한눈에', '')
  push(`- **unstable_cache**: ${caches.map((i) => `${shortTs(i.rel)}(${i.cache.join('/') || '?'}s)`).join(', ')}`)
  push(`- **라우트 revalidate**: ${revs.map((i) => `${/\/(page|route)\.tsx?$/.test(i.rel) ? routeOf(i.rel) : shortTs(i.rel)}(${i.revalidateRoute})`).join(', ')}`)
  push(`- **SWR**: ${swrs.map((i) => shortTs(i.rel)).join(', ') || '없음'}`)
  push(`- **Realtime(postgres_changes)**: ${rts.map((i) => `${shortTs(i.rel)}(${i.channels.join(',') || '?'})`).join(', ') || '없음'}`)
  push('- 대시보드 위젯은 SWR이 아니라 `useEffect`+`fetch` 로 `/api/*` 를 호출한다.', '')
}

// ── 6/7. Python ──
function pySection(title, dir, extra) {
  const files = pyInfos.filter((i) => i.rel.startsWith(`${dir}/`))
  push(title, '')
  if (extra) push(extra, '')
  for (const i of files) {
    const note = noteOf(i.rel)
    if (!note) missing.push(i.rel)
    const f = line([
      i.pub.length ? `defs ${i.pub.join(', ')}${i.priv ? ` (+${i.priv} private)` : ''}` : i.priv ? `${i.priv} private defs` : '',
      dbStr(i.db, i.bucket),
      i.hosts.length ? `ext ${i.hosts.join(',')}` : '',
      i.uses.length ? `→ ${i.uses.join(', ')}` : '',
    ])
    push(`- \`${i.rel.replace(`${dir}/`, '')}\` ${approx(i.lines)}${note ? ` — ${note}` : ''}${f ? ` | ${f}` : ''}`)
  }
  const env = uniq(files.flatMap((i) => i.env))
  push('', `env: ${env.join(', ') || '없음'}`, '')
}
pySection('## 6. `pipeline/` (Python 3.11, GitHub Actions 매일 06:00 KST)', 'pipeline', (notes.pipelineFlow ?? []).map((s) => `- ${s}`).join('\n'))
pySection('## 7. `ai-crew/` (수동 실행 · CI/웹앱에서 호출 안 함)', 'ai-crew', notes.aiCrewNote ?? '')

// ── 8. 인프라 ──
push('## 8. 워크플로우 · 크론 · 스크립트', '')
{
  const wfs = walk('.github/workflows', (r) => /\.ya?ml$/.test(r))
  for (const rel of wfs) {
    const text = read(rel)
    const name = text.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? path.posix.basename(rel)
    const crons = [...text.matchAll(/-\s*cron:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
    const trig = [
      crons.length ? `cron ${crons.join(' | ')}` : '',
      /^\s+push:/m.test(text) ? 'push' : '',
      /^\s+pull_request:/m.test(text) ? 'pull_request' : '',
      /workflow_dispatch/.test(text) ? 'manual' : '',
    ]
    const jobsBlock = text.split(/^jobs:\s*$/m)[1] ?? ''
    const jobs = [...jobsBlock.matchAll(/^ {2}([\w-]+):\s*$/gm)].map((m) => m[1])
    const cmds = []
    for (const l of text.split('\n')) {
      const c = l.replace(/^\s*(-\s*)?(run:\s*)?/, '').trim()
      if (/^(npm|python|node|npx)\s/.test(c) && !cmds.includes(c)) cmds.push(c)
    }
    push(`- \`${rel}\` — ${name} | ${line(trig)}${jobs.length ? ` | jobs ${jobs.join('→')}` : ''}${cmds.length ? ` | ${cmds.map((c) => `\`${c}\``).join(', ')}` : ''}`)
    if (noteOf(rel)) push(`  - ${noteOf(rel)}`)
  }
  if (exists('vercel.json')) {
    const v = JSON.parse(read('vercel.json'))
    for (const c of v.crons ?? []) push(`- vercel cron \`${c.path}\` @ \`${c.schedule}\` (UTC)`)
  }
  const pkg = JSON.parse(read('package.json'))
  push(`- npm scripts: ${Object.entries(pkg.scripts ?? {}).map(([k]) => `\`${k}\``).join(', ')}`)
  for (const s of scriptInfos) {
    const note = noteOf(s.rel)
    if (!note) missing.push(s.rel)
    push(`- \`${s.rel}\` ${approx(s.lines)}${note ? ` — ${note}` : ''}${(() => { const f = line([dbStr(s.db, s.bucket), s.env.length ? `env ${s.env.join(',')}` : '']); return f ? ` | ${f}` : '' })()}`)
  }
  for (const n of notes.infra ?? []) push(`- ${n}`)
  push('')
}

// ── 9. 테스트 ──
push('## 9. 테스트 (vitest, `src/**/*.test.ts`, node 환경) — 컴포넌트·라우트 테스트는 없음', '')
for (const i of tsInfos.filter((x) => x.isTest)) {
  const targets = i.internal.map(shortTs)
  push(`- \`${shortTs(i.rel).replace(/^lib\//, '')}\` → ${targets.join(', ') || '(대상 없음)'}`)
}
push('')

push('## 10. 이 지도에 없는 것', '', ...(notes.excluded ?? []).map((e) => `- ${e}`), '')

// ───────────────────────── 쓰기 ─────────────────────────

const next = out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
const outAbs = path.join(ROOT, OUT_REL)
const prev = fs.existsSync(outAbs) ? fs.readFileSync(outAbs, 'utf8') : ''
if (prev !== next) {
  fs.mkdirSync(path.dirname(outAbs), { recursive: true })
  fs.writeFileSync(outAbs, next)
  console.log(
    `🗺️  codemap 갱신: ${OUT_REL} (${(Buffer.byteLength(next) / 1024).toFixed(1)}KB, ts ${tsInfos.length} · py ${pyInfos.length}${missing.length ? ` · 설명 누락 ${missing.length}` : ''})`
  )
}
if (VERBOSE && missing.length) console.log(`설명 없는 파일:\n${[...new Set(missing)].map((m) => `  ${m}`).join('\n')}`)
