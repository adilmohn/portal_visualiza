export function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="Carregando..."
      className="flex min-h-[50vh] w-full items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <span className="text-xs font-medium text-muted-foreground animate-pulse">
          Carregando...
        </span>
      </div>
    </div>
  )
}
