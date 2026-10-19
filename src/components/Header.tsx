import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Sun, Moon, LogIn, LogOut, ShieldCheck, User } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, signOut, role } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 backdrop-blur-md bg-background/85 ${
        isScrolled ? 'border-b border-border shadow-sm' : 'border-b border-border/60'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        {/* Left: Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1 pr-2 transition-transform duration-150 active:scale-95"
          aria-label="Portal Viabilize — Início"
        >
          {/* Logo mark icon: rounded square with stylized 'V' */}
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <polyline points="4 7 12 17 20 7" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
            Portal <span className="text-primary">Viabilize</span>
          </span>
        </Link>

        {/* Center/Desktop Nav links (optional subtle institutional nav) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <NavLink
            to="/diretorio"
            className={({ isActive }) =>
              `transition-colors hover:text-foreground ${
                isActive ? 'text-primary font-semibold' : ''
              }`
            }
          >
            Diretório
          </NavLink>
          <NavLink
            to="/area"
            className={({ isActive }) =>
              `transition-colors hover:text-foreground ${
                isActive ? 'text-primary font-semibold' : ''
              }`
            }
          >
            Minha Área
          </NavLink>
          {role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `transition-colors hover:text-foreground flex items-center gap-1 ${
                  isActive ? 'text-primary font-semibold' : ''
                }`
              }
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin</span>
            </NavLink>
          )}
          <NavLink
            to="/sobre"
            className={({ isActive }) =>
              `transition-colors hover:text-foreground ${
                isActive ? 'text-primary font-semibold' : ''
              }`
            }
          >
            Sobre
          </NavLink>
        </nav>

        {/* Right: Dark mode toggle + Auth buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
            className="relative h-9 w-9 rounded-lg text-foreground hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sun
              className="h-4 w-4 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0"
              aria-hidden="true"
            />
            <Moon
              className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100"
              aria-hidden="true"
            />
          </Button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex h-9 gap-1.5 text-xs font-medium"
              >
                <Link to="/area">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[100px] truncate">{user?.name || user?.email}</span>
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={signOut}
                title="Sair da conta"
                className="h-9 px-2.5 text-muted-foreground hover:text-destructive gap-1 text-xs"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          ) : (
            <Button
              asChild
              className="h-9 px-4 sm:px-5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Link to="/login" className="inline-flex items-center gap-1.5">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>Entrar</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
