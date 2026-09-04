import { create } from 'zustand'
import type { Category } from '@/lib/types'

/**
 * 딥링크가 필요한 상태(활성 탭·선택 날짜)는 URL이 진실의 원천이므로
 * 여기에 두지 않는다 — TabNav는 pathname/`?tab=`을, DateNav는 경로를 읽는다.
 * 이 스토어에는 URL에 남길 필요가 없는 순수 UI 상태만 둔다.
 */
interface AppStore {
  categoryFilter: Category
  setFilter: (cat: Category) => void
}

export const useAppStore = create<AppStore>((set) => ({
  categoryFilter: '전체' as Category,
  setFilter: (cat) => set({ categoryFilter: cat }),
}))
