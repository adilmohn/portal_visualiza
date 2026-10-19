import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Portal Viabilize Error Boundary caught an error:', error, errorInfo)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
          <div className="w-full max-w-md text-center bg-card border border-border rounded-xl p-8 shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Algo deu errado
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Ocorreu um erro inesperado ao carregar esta página.
            </p>
            {this.state.error?.message ? (
              <pre className="mt-4 max-h-28 overflow-auto rounded bg-muted/60 p-2 text-left font-mono text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            ) : null}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-2.5 rounded shadow-sm transition-all"
              >
                <RotateCw className="h-4 w-4" />
                Recarregar
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
