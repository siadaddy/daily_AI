import { create } from 'zustand'
import type { TabId, Category } from '@/lib/types'

interface AppStore {
  activeTab: TabId
  categoryFilter: Category
  selectedDate: string
  setTab: (tab: TabId) => void
  setFilter: (cat: Category) => void
  setDate: (date: string) => void
}

function todayKST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: 'newsletter',
  categoryFilter: '전체' as Category,
  selectedDate: todayKST(),
  setTab: (tab) => set({ activeTab: tab }),
  setFilter: (cat) => set({ categoryFilter: cat }),
  setDate: (date) => set({ selectedDate: date }),
}))
