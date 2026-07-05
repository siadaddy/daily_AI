/**
 * 사용자 입력 검증 — Server Actions(community.ts 등)에서 사용
 * 새 사용자 생성 콘텐츠 기능을 추가할 때 이 헬퍼를 재사용하세요.
 */

export const LIMITS = {
  postTitle: 100,
  postContent: 5000,
  comment: 1000,
  nickname: 20,
} as const

/**
 * 문자열 입력을 trim 후 빈 값/길이 검증.
 * 통과하면 { value }, 실패하면 { error } (한국어 메시지) 반환.
 */
export function validateText(
  raw: string,
  label: string,
  maxLength: number
): { value: string; error: null } | { value: null; error: string } {
  if (typeof raw !== 'string') {
    return { value: null, error: `${label}을(를) 입력해주세요` }
  }
  const value = raw.trim()
  if (!value) {
    return { value: null, error: `${label}을(를) 입력해주세요` }
  }
  if (value.length > maxLength) {
    return {
      value: null,
      error: `${label}은(는) ${maxLength.toLocaleString()}자 이하로 입력해주세요`,
    }
  }
  return { value, error: null }
}

/** content_key 형식 검증 (영문/숫자/하이픈/언더스코어/콜론/점, 최대 200자) */
export function isValidContentKey(key: string): boolean {
  return typeof key === 'string' && /^[\w:.-]{1,200}$/.test(key)
}

/**
 * Supabase 에러를 사용자에게 그대로 노출하지 않기 위한 일반화 메시지.
 * 원본 에러는 서버 로그로만 남긴다.
 */
export function publicDbError(
  error: { message: string } | null,
  context: string
): string | null {
  if (!error) return null
  console.error(`[${context}]`, error.message)
  return '요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
