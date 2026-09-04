import type { Metadata, Viewport } from 'next'
import { Gowun_Batang, IBM_Plex_Mono, Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

/**
 * Editorial Dark 타이포 3종 — 역할이 겹치지 않게 고른다.
 *
 * 처음에는 Noto Serif KR + Noto Sans KR을 썼지만 둘은 같은 골격으로 설계된
 * 슈퍼패밀리라 제목과 본문의 "목소리"가 구분되지 않았다. 게다가 Noto는 두부
 * 방지용 폴백으로 설계된 서체라 개성이 없는 게 목적이다 — 라틴에서 Inter를
 * 걷어내 놓고 한글에는 같은 기본값을 쓰고 있던 셈.
 *
 * · 고운바탕 — 한글 디스플레이. 바탕체 계열의 온기가 있고 400/700을 제대로
 *   갖춰 15px 카드 제목부터 52px 제호까지 가짜 볼드 없이 쓸 수 있다.
 *   (송명은 고대비라 더 신문답지만 400 단일 웨이트뿐이라 제외)
 * · Noto Sans KR — 본문. 한글 장문 가독성은 여전히 최상급이라 유지.
 * · IBM Plex Mono — 키커·날짜·수치. 편집적 목소리가 있고 등폭 숫자가 정확하다.
 *   한글 글리프는 없으므로 globals.css의 --font-mono 스택에서 Noto Sans KR로
 *   떨어지게 해 두었다(한글 키커가 시스템 고정폭으로 튀지 않도록).
 */
const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-kr',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

const gowunBatang = Gowun_Batang({
  variable: '--font-serif-kr',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // 브라우저 UI(주소창)가 페이지 바탕과 이어지도록 — 테마별 잉크 값
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0c' },
    { media: '(prefers-color-scheme: light)', color: '#f2efe9' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: '시아아빠의 AI 데일리',
    template: '%s | 시아아빠의 AI 데일리',
  },
  description:
    'AI가 매일 자동 생성하는 뉴스레터 · 트렌드 리포트 · 음악 유니버스',
  openGraph: {
    url: '/',
    title: '시아아빠의 AI 데일리',
    description:
      'AI가 매일 자동 생성하는 뉴스레터 · 트렌드 리포트 · 음악 유니버스',
    siteName: '시아아빠의 AI 데일리',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '시아아빠의 AI 데일리',
    description:
      'AI가 매일 자동 생성하는 뉴스레터 · 트렌드 리포트 · 음악 유니버스',
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  verification: {
    google: 'OiINyrZjXP18pcwtzIkV8J0XR9_gXxjhf-UQoau69l8',
    other: {
      'naver-site-verification': '24197017690a52331e9a71eaac33b9368ee7792f',
    },
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '시아아빠의 AI 데일리',
  alternateName: '시아아빠',
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/opengraph-image`,
  description:
    'AI가 매일 자동 생성하는 뉴스레터 · 트렌드 리포트 · 음악 유니버스',
}

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '시아아빠의 AI 데일리',
  url: getSiteUrl(),
  inLanguage: 'ko-KR',
  description:
    'AI가 매일 자동 생성하는 뉴스레터 · 트렌드 리포트 · 음악 유니버스',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${getSiteUrl()}/keyword/{search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${gowunBatang.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteJsonLd),
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
