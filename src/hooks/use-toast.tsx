"use client"

import * as React from "react"

type ToastVariant = "default" | "destructive"

interface Toast {
    id: string
    title?: string
    description?: string
    variant?: ToastVariant
}

interface ToastContextType {
    toasts: Toast[]
    toast: (props: Omit<Toast, "id">) => void
    dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

let toastCount = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const toast = React.useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
        const id = String(++toastCount)
        setToasts((prev) => [...prev, { id, title, description, variant }])

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    const dismiss = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value= {{ toasts, toast, dismiss }
}>
    { children }
    < ToastContainer toasts = { toasts } onDismiss = { dismiss } />
        </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    if (toasts.length === 0) return null

    return (
        <div className= "fixed bottom-4 right-4 z-50 flex flex-col gap-2" >
        {
            toasts.map((toast) => (
                <div
          key= { toast.id }
          className = {`
            rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm
            animate-in slide-in-from-right-full fade-in-0 transition-all
            ${toast.variant === "destructive"
                        ? "border-red-200 bg-red-50 text-red-900"
                        : "border-gray-200 bg-white text-gray-900"
                    }
          `}
    onClick = {() => onDismiss(toast.id)
}
        >
{
    toast.title && (
        <div className="font-semibold text-sm"> { toast.title } </div>
          )
}
{
    toast.description && (
        <div className="text-sm opacity-90" > { toast.description } </div>
          )
}
</div>
      ))}
</div>
  )
}

export function useToast() {
    const context = React.useContext(ToastContext)
    if (!context) {
        // Return a no-op toast function if not in provider (for simpler usage)
        return {
            toast: (props: Omit<Toast, "id">) => {
                console.log("Toast:", props)
            },
            toasts: [],
            dismiss: () => { },
        }
    }
    return context
}
