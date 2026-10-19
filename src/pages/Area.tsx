import { LayoutDashboard } from 'lucide-react'

export default function Area() {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center animate-fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LayoutDashboard className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Minha Área</h1>
      <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-md">
        Em breve — acesso à sua área pessoal.
      </p>
    </div>
  )
}
