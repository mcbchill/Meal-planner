import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface ToastState {
  message: string
  actionLabel?: string
  onAction?: () => void
}

interface ToastApi {
  /** Show a transient snackbar, optionally with an action (e.g. Undo). */
  showToast: (message: string, actionLabel?: string, onAction?: () => void) => void
}

const ToastContext = createContext<ToastApi | null>(null)
const DURATION = 6000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const showToast = useCallback(
    (message: string, actionLabel?: string, onAction?: () => void) => {
      window.clearTimeout(timer.current)
      setToast({ message, actionLabel, onAction })
      timer.current = window.setTimeout(() => setToast(null), DURATION)
    },
    [],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast__msg">{toast.message}</span>
          {toast.actionLabel && (
            <button
              className="toast__action"
              onClick={() => {
                toast.onAction?.()
                dismiss()
              }}
            >
              {toast.actionLabel}
            </button>
          )}
          <button className="toast__close" aria-label="Dismiss" onClick={dismiss}>
            ✕
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
