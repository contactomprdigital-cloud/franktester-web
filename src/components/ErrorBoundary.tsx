import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-forest-950 px-4 text-center">
          <div>
            <h1 className="font-display text-3xl text-cream">Algo salió mal</h1>
            <p className="mt-2 text-sm text-cream/60">
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 min-h-[44px] rounded-full bg-gold-500 px-6 text-sm font-semibold uppercase tracking-wide text-forest-950"
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
