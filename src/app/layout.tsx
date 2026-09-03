import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-kr',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
      className={`${inter.variable} ${notoSansKR.variable}`}
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
