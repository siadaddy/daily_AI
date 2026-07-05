import type { KeywordStat } from '@/lib/types'

const STOPWORDS = new Set([
  // 조사
  '이',
  '가',
  '을',
  '를',
  '은',
  '는',
  '의',
  '에',
  '에서',
  '로',
  '으로',
  '와',
  '과',
  '도',
  '만',
  '까지',
  '부터',
  '에게',
  '한테',
  '께',
  '보다',
  '처럼',
  '만큼',
  '같이',
  '마저',
  '조차',
  '밖에',
  '이나',
  '나',
  '라도',
  // 동사/형용사 어간
  '한',
  '하는',
  '하고',
  '하여',
  '하며',
  '있는',
  '있다',
  '됩니다',
  '합니다',
  '된다',
  '된',
  '되는',
  '되어',
  '위해',
  '대한',
  '통해',
  '위한',
  '관련',
  '따른',
  '따라',
  '통한',
  '이후',
  '이전',
  '이상',
  '이하',
  '미만',
  // 일반 명사 (노이즈)
  '발표',
  '공개',
  '출시',
  '예정',
  '올해',
  '내년',
  '지난',
  '다음',
  '이번',
  '기준',
  '기반',
  '진행',
  '실시',
  '대비',
  '증가',
  '감소',
  '개선',
  '강화',
  '확대',
  '추진',
  '계획',
  '목표',
  '달성',
  '운영',
  '관리',
  '제공',
  '지원',
  '적용',
  '도입',
  '구축',
  '개발',
  '생산',
  '판매',
  '수출',
  '수입',
  '성장',
  '하락',
  '상승',
  '변화',
  '현황',
  '상황',
  '결과',
  '영향',
  '효과',
  '방안',
  '방법',
  '문제',
  '해결',
  '필요',
  '중요',
  '주요',
  '최근',
  '현재',
  '향후',
  '오는',
  '아는',
  '없는',
  '많은',
  '새로운',
  '높은',
  '낮은',
  '큰',
  '작은',
  '위',
  '아래',
  '앞',
  '뒤',
  '안',
  '밖',
  '등',
  '및',
  '또',
  '또한',
  '그리고',
  '하지만',
  '그러나',
  '따라서',
  '그래서',
  '때문에',
  '대해',
  '대해서',
])

// HTML entities and common noise that appear in scraped Korean news titles
const NOISE_TOKENS = new Set([
  'quot',
  'amp',
  'lt',
  'gt',
  'nbsp',
  'apos',
  'hellip',
  'middot',
])

function tokenize(text: string): string[] {
  return text
    .replace(/&[a-z]+;/gi, ' ') // strip HTML entities
    .replace(/[^가-힣ᄀ-ᇿ㄰-㆏\w\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(
      (t) =>
        t.length >= 2 &&
        !/^\d+$/.test(t) &&
        !STOPWORDS.has(t) &&
        !NOISE_TOKENS.has(t.toLowerCase())
    )
}

function extractHashtags(content: string): string[] {
  const lines = content.trim().split('\n')
  const lastLine = lines[lines.length - 1]
  if (!lastLine.includes('#')) return []
  return (lastLine.match(/#[^\s#]+/g) ?? [])
    .map((t) => t.slice(1))
    .filter((t) => t.length >= 2)
}

export function extractKeywords(params: {
  titles: string[]
  trendTitles: string[]
  articleContents: string[]
  topN?: number
}): KeywordStat[] {
  const { titles, trendTitles, articleContents, topN = 20 } = params
  const freq: Map<string, number> = new Map()

  const add = (word: string, weight: number) => {
    freq.set(word, (freq.get(word) ?? 0) + weight)
  }

  for (const t of titles) {
    for (const w of tokenize(t)) add(w, 1)
  }

  for (const t of trendTitles) {
    for (const w of tokenize(t)) add(w, 3)
  }

  for (const content of articleContents) {
    for (const tag of extractHashtags(content)) add(tag, 3)
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }))
}
