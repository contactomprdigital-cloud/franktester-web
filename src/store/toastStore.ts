import { create } from 'zustand'

interface ToastState {
  message: string
  withCartAction: boolean
  visible: boolean
  show: (message: string, withCartAction?: boolean) => void
  hide: () => void
}

let hideTimer: ReturnType<typeof setTimeout> | undefined

export const useToastStore = create<ToastState>()((set) => ({
  message: '',
  withCartAction: false,
  visible: false,
  show: (message, withCartAction = false) => {
    clearTimeout(hideTimer)
    set({ message, withCartAction, visible: true })
    hideTimer = setTimeout(() => set({ visible: false }), 2600)
  },
  hide: () => {
    clearTimeout(hideTimer)
    set({ visible: false })
  },
}))
