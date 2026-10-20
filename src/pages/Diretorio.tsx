import { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  Lightbulb,
  Package,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useListingSearch } from '@/hooks/use-listing-search'
import {
  ListingType,
  ListingItem,
  getDirectoryLocations,
  GeoLocationOption,
} from '@/services/listings'
import pb from '@/lib/pocketbase/client'

const ALL_FILTER_VALUE = '__all__'

const TYPE_CONFIG: Record<
  ListingType,
  { label: string; badgeClass: string; icon: typeof Building2 }
> = {
  empresa: {
    label: 'Empresa',
    badgeClass:
      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Building2,
  },
  negocio: {
    label: 'Negócio Local',
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: Briefcase,
  },
  solucao: {
    label: 'Solução',
    badgeClass:
      'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    icon: Lightbulb,
  },
  produto: {
    label: 'Produto',
    badgeClass:
      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: Package,
  },
  servico: {
    label: 'Serviço',
    badgeClass:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    icon: Briefcase,
  },
}

export default function Diretorio() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read URL search params
  const paramState = searchParams.get('state') || ''
  const paramCity = searchParams.get('city') || ''
  const paramNeighborhood = searchParams.get('neighborhood') || ''
  const paramType = (searchParams.get('type') || '') as ListingType | ''
  const paramKeyword = searchParams.get('keyword') || ''
  const paramPage = parseInt(searchParams.get('page') || '1', 10) || 1

  // Local state for debounced keyword input
  const [keywordInput, setKeywordInput] = useState(paramKeyword)

  // Keep local input in sync if URL param changes externally
  useEffect(() => {
    setKeywordInput(paramKeyword)
  }, [paramKeyword])

  // Geographic locations loaded from backend
  const [locations, setLocations] = useState<GeoLocationOption[]>([])

  useEffect(() => {
    let mounted = true
    getDirectoryLocations().then((res) => {
      if (mounted) {
        setLocations(res)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  // 300ms Debounce for keyword input
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentParamKeyword = searchParams.get('keyword') || ''
      if (keywordInput.trim() !== currentParamKeyword) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            if (keywordInput.trim()) {
              next.set('keyword', keywordInput.trim())
            } else {
              next.delete('keyword')
            }
            next.set('page', '1') // reset page on filter change
            return next
          },
          { replace: true },
        )
      }
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [keywordInput, searchParams, setSearchParams])

  // Memoized filter options for cascading selects
  const stateOptions = useMemo(() => {
    const states = Array.from(new Set(locations.map((l) => l.state).filter(Boolean)))
    return states.sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [locations])

  const cityOptions = useMemo(() => {
    if (!paramState) return []
    const cities = Array.from(
      new Set(
        locations
          .filter((l) => l.state.toLowerCase() === paramState.toLowerCase())
          .map((l) => l.city)
          .filter(Boolean),
      ),
    )
    return cities.sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [locations, paramState])

  const neighborhoodOptions = useMemo(() => {
    if (!paramCity) return []
    const neighborhoods = Array.from(
      new Set(
        locations
          .filter(
            (l) =>
              (!paramState || l.state.toLowerCase() === paramState.toLowerCase()) &&
              l.city.toLowerCase() === paramCity.toLowerCase(),
          )
          .map((l) => l.neighborhood)
          .filter(Boolean),
      ),
    )
    return neighborhoods.sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [locations, paramState, paramCity])

  // Cascading Select Handlers
  const handleStateChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value && value !== ALL_FILTER_VALUE) {
          next.set('state', value)
        } else {
          next.delete('state')
        }
        // Cascading reset: clearing or changing state clears city and neighborhood
        next.delete('city')
        next.delete('neighborhood')
        next.set('page', '1')
        return next
      })
    },
    [setSearchParams],
  )

  const handleCityChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value && value !== ALL_FILTER_VALUE) {
          next.set('city', value)
        } else {
          next.delete('city')
        }
        // Cascading reset: clearing or changing city clears neighborhood
        next.delete('neighborhood')
        next.set('page', '1')
        return next
      })
    },
    [setSearchParams],
  )

  const handleNeighborhoodChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value && value !== ALL_FILTER_VALUE) {
          next.set('neighborhood', value)
        } else {
          next.delete('neighborhood')
        }
        next.set('page', '1')
        return next
      })
    },
    [setSearchParams],
  )

  const handleTypeChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value && value !== ALL_FILTER_VALUE) {
          next.set('type', value)
        } else {
          next.delete('type')
        }
        next.set('page', '1')
        return next
      })
    },
    [setSearchParams],
  )

  const handleClearFilters = useCallback(() => {
    setKeywordInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', newPage.toString())
        return next
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [setSearchParams],
  )

  // Query search via hook
  const searchParamsObject = useMemo(
    () => ({
      state: paramState,
      city: paramCity,
      neighborhood: paramNeighborhood,
      type: paramType,
      keyword: paramKeyword,
      page: paramPage,
    }),
    [paramState, paramCity, paramNeighborhood, paramType, paramKeyword, paramPage],
  )

  const { status, items, total, totalPages, refetch } = useListingSearch(searchParamsObject)

  const hasActiveFilters = Boolean(
    paramState || paramCity || paramNeighborhood || paramType || paramKeyword,
  )

  // Track contact event click for analytics
  const trackContact = useCallback(
    async (listingId: string, channel: 'whatsapp' | 'telefone' | 'email' | 'site') => {
      try {
        await pb.collection('contactEvents').create({
          listingId,
          channel,
        })
      } catch (_) {
        // silent analytics track
      }
    },
    [],
  )

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl animate-fade-in">
      {/* Page Header */}
      <header className="mb-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Diretório de Negócios e Soluções
            </h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground">
              Encontre empresas verificadas, negócios locais, soluções tecnológicas e produtos
              inovadores.
            </p>
          </div>
          {status === 'success' && (
            <div className="text-sm font-medium text-muted-foreground self-center sm:self-auto bg-muted/60 px-3.5 py-1.5 rounded-full border">
              {total} {total === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </div>
          )}
        </div>
      </header>

      {/* Filter Toolbar */}
      <section
        aria-label="Filtros de busca"
        className="mb-8 rounded-2xl border bg-card p-4 sm:p-6 shadow-sm transition-all"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Keyword Search */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label
              htmlFor="directory-search-input"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Buscar por nome ou descrição
            </label>
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="directory-search-input"
                type="text"
                value={keywordInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setKeywordInput(e.target.value)}
                placeholder="Ex: tecnologia, consultoria, café..."
                aria-label="Campo de busca por palavra-chave"
                className="pl-10 h-11 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Type Select */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label
              htmlFor="directory-type-select"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Tipo
            </label>
            <Select value={paramType || ALL_FILTER_VALUE} onValueChange={handleTypeChange}>
              <SelectTrigger
                id="directory-type-select"
                aria-label="Filtrar por tipo de negócio"
                className="h-11 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
              >
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE} className="min-h-[44px]">
                  Todos os tipos
                </SelectItem>
                <SelectItem value="empresa" className="min-h-[44px]">
                  Empresa
                </SelectItem>
                <SelectItem value="negocio" className="min-h-[44px]">
                  Negócio Local
                </SelectItem>
                <SelectItem value="solucao" className="min-h-[44px]">
                  Solução
                </SelectItem>
                <SelectItem value="produto" className="min-h-[44px]">
                  Produto
                </SelectItem>
                <SelectItem value="servico" className="min-h-[44px]">
                  Serviço
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cascading: State */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label
              htmlFor="directory-state-select"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Estado (UF)
            </label>
            <Select value={paramState || ALL_FILTER_VALUE} onValueChange={handleStateChange}>
              <SelectTrigger
                id="directory-state-select"
                aria-label="Filtrar por estado"
                className="h-11 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
              >
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE} className="min-h-[44px]">
                  Todos os estados
                </SelectItem>
                {stateOptions.map((st) => (
                  <SelectItem key={st} value={st} className="min-h-[44px]">
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cascading: City */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label
              htmlFor="directory-city-select"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Cidade
            </label>
            <Select
              value={paramCity || ALL_FILTER_VALUE}
              onValueChange={handleCityChange}
              disabled={!paramState || cityOptions.length === 0}
            >
              <SelectTrigger
                id="directory-city-select"
                aria-label="Filtrar por cidade"
                className="h-11 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                <SelectValue
                  placeholder={!paramState ? 'Selecione o estado' : 'Todas as cidades'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE} className="min-h-[44px]">
                  Todas as cidades
                </SelectItem>
                {cityOptions.map((ct) => (
                  <SelectItem key={ct} value={ct} className="min-h-[44px]">
                    {ct}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cascading: Neighborhood */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label
              htmlFor="directory-neighborhood-select"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Bairro
            </label>
            <Select
              value={paramNeighborhood || ALL_FILTER_VALUE}
              onValueChange={handleNeighborhoodChange}
              disabled={!paramCity || neighborhoodOptions.length === 0}
            >
              <SelectTrigger
                id="directory-neighborhood-select"
                aria-label="Filtrar por bairro"
                className="h-11 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                <SelectValue placeholder={!paramCity ? 'Selecione a cidade' : 'Todos os bairros'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE} className="min-h-[44px]">
                  Todos os bairros
                </SelectItem>
                {neighborhoodOptions.map((nb) => (
                  <SelectItem key={nb} value={nb} className="min-h-[44px]">
                    {nb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters Button row if any filter active */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-muted-foreground">Filtros ativos selecionados.</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              aria-label="Limpar todos os filtros aplicados"
              className="min-h-[44px] text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Limpar todos os filtros
            </Button>
          </div>
        )}
      </section>

      {/* Main Content: Loading, Error, Empty or Results Grid */}
      <main aria-live="polite">
        {status === 'loading' && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-label="Carregando resultados..."
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={`skeleton-${idx}`} className="overflow-hidden border shadow-sm">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardHeader className="space-y-2 p-5 pb-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="p-5 pt-2 pb-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <CardFooter className="p-5 pt-0">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 sm:p-12 text-center max-w-xl mx-auto my-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Não foi possível carregar o diretório
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocorreu um erro ao consultar os anúncios no servidor. Por favor, tente novamente.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => refetch()}
                className="min-h-[44px] min-w-[140px] font-medium"
                aria-label="Tentar carregar o diretório novamente"
              >
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {status === 'success' && items.length === 0 && (
          <div className="rounded-2xl border bg-card p-10 sm:p-16 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Search className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Nenhum negócio encontrado
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Não encontramos resultados correspondentes aos filtros aplicados. Tente ajustar o
              termo de busca ou limpar os filtros para ver mais cadastros.
            </p>
            {hasActiveFilters && (
              <div className="mt-6">
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="min-h-[44px] font-medium"
                  aria-label="Limpar filtros para ver todos os negócios"
                >
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Limpar todos os filtros
                </Button>
              </div>
            )}
          </div>
        )}

        {status === 'success' && items.length > 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onTrackContact={trackContact} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Navegação entre páginas de resultados"
                className="mt-12 flex items-center justify-center gap-2 flex-wrap"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, paramPage - 1))}
                  disabled={paramPage <= 1}
                  aria-label="Página anterior"
                  className="min-h-[44px] px-3 font-medium"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1 mx-2 text-sm font-medium text-muted-foreground">
                  <span>Página</span>
                  <span className="font-semibold text-foreground">{paramPage}</span>
                  <span>de</span>
                  <span className="font-semibold text-foreground">{totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, paramPage + 1))}
                  disabled={paramPage >= totalPages}
                  aria-label="Próxima página"
                  className="min-h-[44px] px-3 font-medium"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Button>
              </nav>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

interface ListingCardProps {
  listing: ListingItem
  onTrackContact: (listingId: string, channel: 'whatsapp' | 'telefone' | 'email' | 'site') => void
}

function ListingCard({ listing, onTrackContact }: ListingCardProps) {
  const typeConfig = TYPE_CONFIG[listing.type] || TYPE_CONFIG.empresa
  const TypeIcon = typeConfig.icon

  // Location display: Neighborhood + City/State or City/State
  const locationText = useMemo(() => {
    const parts: string[] = []
    if (listing.neighborhood) parts.push(listing.neighborhood)
    if (listing.city) {
      parts.push(listing.state ? `${listing.city} - ${listing.state}` : listing.city)
    }
    return parts.join(', ') || 'Brasil'
  }, [listing.neighborhood, listing.city, listing.state])

  // Truncate description for card display
  const shortDescription = useMemo(() => {
    if (!listing.description) return ''
    if (listing.description.length <= 160) return listing.description
    return listing.description.slice(0, 157) + '...'
  }, [listing.description])

  // Image source: custom photo or Curling placeholder photo
  const photoSrc = useMemo(() => {
    if (listing.photo) {
      if (listing.photo.startsWith('http')) return listing.photo
      const base = import.meta.env.VITE_POCKETBASE_URL || ''
      return `${base.replace(/\/$/, '')}${listing.photo}`
    }
    // High-quality curling image using appropriate keyword
    const keywordMap: Record<ListingType, string> = {
      empresa: 'office',
      negocio: 'store',
      solucao: 'technology',
      produto: 'product',
      servico: 'service',
    }
    const kw = keywordMap[listing.type] || 'business'
    return `https://img.usecurling.com/p/600/360?q=${kw}&color=slate`
  }, [listing.photo, listing.type])

  return (
    <Card className="flex flex-col h-full overflow-hidden border bg-card hover:shadow-md transition-shadow group">
      {/* Photo with lazy loading and width/height */}
      <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden">
        <img
          src={photoSrc}
          alt={`Foto de ${listing.name}`}
          loading="lazy"
          width={600}
          height={375}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={`shadow-sm text-xs font-medium px-2.5 py-0.5 border ${typeConfig.badgeClass} flex items-center gap-1`}
          >
            <TypeIcon className="h-3 w-3" aria-hidden="true" />
            {typeConfig.label}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-5 pb-2">
        <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {listing.name}
        </h3>
        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{locationText}</span>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 pb-4 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {shortDescription}
        </p>
      </CardContent>

      <CardFooter className="p-5 pt-0 border-t bg-muted/20 mt-auto flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {listing.whatsapp && (
            <a
              href={`https://wa.me/55${listing.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackContact(listing.id, 'whatsapp')}
              aria-label={`Conversar no WhatsApp com ${listing.name}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </a>
          )}

          {listing.phone && (
            <a
              href={`tel:${listing.phone.replace(/\D/g, '')}`}
              onClick={() => onTrackContact(listing.id, 'telefone')}
              aria-label={`Ligar para ${listing.name}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
          )}

          {listing.email && (
            <a
              href={`mailto:${listing.email}`}
              onClick={() => onTrackContact(listing.id, 'email')}
              aria-label={`Enviar e-mail para ${listing.name}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>

        {listing.website && (
          <a
            href={listing.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackContact(listing.id, 'site')}
            aria-label={`Visitar site de ${listing.name}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1 min-h-[36px]"
          >
            Visitar site
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
