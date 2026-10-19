import { FileText } from 'lucide-react'

export default function Termos() {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center animate-fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FileText className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Termos</h1>
      <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-md">
        Leia os termos de uso do Portal.
      </p>
    </div>
  )
}
