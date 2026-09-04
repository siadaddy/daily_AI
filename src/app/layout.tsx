import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

/**
 * Editorial Dark 타이포 3종.
 * 헤드라인은 세리프(신문 제목), 본문은 산세리프(한글 장문 가독성),
 * 키커·날짜·수치는 모노 — 셋의 역할이 겹치지 않는다.
 */
const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-kr',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

const notoSerifKR = Noto_Serif_KR({
  variable: '--font-serif-kr',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
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
      className={`${notoSansKR.variable} ${notoSerifKR.variable} ${jetbrainsMono.variable}`}
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
