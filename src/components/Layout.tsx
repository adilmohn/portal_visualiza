import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
