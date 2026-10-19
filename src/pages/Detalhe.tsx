import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Building2,
  Briefcase,
  Lightbulb,
  Package,
  MapPin,
  Mail,
  Phone,
  Globe,
  Share2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Tag,
  ArrowLeft,
  Sparkles,
  Calendar,
  RotateCw,
  AlertCircle,
  HelpCircle,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useListingDetail } from '@/hooks/use-listing-detail'
import { recordContactEvent, ContactChannel, ListingPhoto } from '@/services/listing-detail'
import { ListingType } from '@/services/listings'
import { toast } from '@/hooks/use-toast'

const TYPE_CONFIG: Record<
  ListingType,
  { label: string; badgeClass: string; schemaType: string; icon: typeof Building2 }
> = {
  empresa: {
    label: 'Empresa',
    badgeClass:
      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    schemaType: 'LocalBusiness',
    icon: Building2,
  },
  negocio: {
    label: 'Negócio Local',
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    schemaType: 'LocalBusiness',
    icon: Briefcase,
  },
  solucao: {
    label: 'Solução',
    badgeClass:
      'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    schemaType: 'Product',
    icon: Lightbulb,
  },
  produto: {
    label: 'Produto',
    badgeClass:
      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    schemaType: 'Product',
    icon: Package,
  },
}

function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  // If no country code, prepend 55 (Brazil)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }
  return digits
}

function normalizeTelNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return raw.trim()
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`
  }
  return `+${digits}`
}

function ensureHttpUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

/**
 * Interactive Photo Gallery
 */
interface PhotoGalleryProps {
  photos: ListingPhoto[]
  title: string
  type: ListingType
}

const PhotoGallery = memo(function PhotoGallery({ photos, title, type }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Safe fallback placeholder
  const placeholderUrl = useMemo(() => {
    const kwMap: Record<ListingType, string> = {
      empresa: 'office,building',
      negocio: 'store,retail',
      solucao: 'technology,laptop',
      produto: 'package,craft',
    }
    const kw = kwMap[type] || 'business'
    return `https://img.usecurling.com/p/1200/800?q=${encodeURIComponent(kw)}`
  }, [type])

  if (!photos || photos.length === 0) {
    return (
      <div className="relative w-full aspect-video sm:aspect-[16/9] md:aspect-[21/10] overflow-hidden rounded-2xl border bg-muted shadow-sm">
        <img
          src={placeholderUrl}
          alt={`Imagem representativa de ${title}`}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4 sm:p-6">
          <span className="text-xs sm:text-sm font-medium text-white/90 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            Foto ilustrativa
          </span>
        </div>
      </div>
    )
  }

  const activePhoto = photos[selectedIndex] || photos[0]

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  return (
    <div className="space-y-3">
      {/* Main photo */}
      <div className="relative w-full aspect-video sm:aspect-[16/9] md:aspect-[21/10] overflow-hidden rounded-2xl border bg-black/5 shadow-sm group">
        <img
          src={activePhoto.url}
          alt={`${title} - Foto ${selectedIndex + 1} de ${photos.length}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all opacity-90 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all opacity-90 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20">
              {selectedIndex + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {photos.map((photo, idx) => {
            const isSelected = idx === selectedIndex
            return (
              <button
                key={photo.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`Ver foto ${idx + 1}`}
                className={`relative flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border-2 transition-all min-h-[44px] ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 scale-105'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={photo.url}
                  alt={`Miniatura ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
})

/**
 * Main Detalhe Page
 */
export default function Detalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: listing, isLoading, isNotFound, isError, refetch } = useListingDetail(id)

  // Track contact event and dispatch link
  const handleContactClick = useCallback(
    (channel: ContactChannel, href: string, isExternalTargetBlank = false) => {
      if (listing?.id) {
        // Fire-and-forget: records event without blocking navigation
        recordContactEvent({ listingId: listing.id, channel })
      }

      if (isExternalTargetBlank) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = href
      }
    },
    [listing?.id],
  )

  const handleShare = useCallback(async () => {
    if (!listing) return
    const shareData = {
      title: `${listing.name} | Portal Viabilize`,
      text: `Conheça ${listing.name} no Portal Viabilize: ${listing.city} - ${listing.state}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: 'Link copiado!',
          description: 'O link deste anúncio foi copiado para sua área de transferência.',
        })
      }
    } catch (_) {
      // User canceled share
    }
  }, [listing])

  // Dynamic SEO Document Title, Meta Description & Schema.org JSON-LD injection
  useEffect(() => {
    if (!listing) return

    const typeConfig = TYPE_CONFIG[listing.type] || TYPE_CONFIG.empresa
    const typeLabel = typeConfig.label
    const pageTitle = `${listing.name} - ${typeLabel} em ${listing.city}, ${listing.state} | Portal Viabilize`
    const previousTitle = document.title
    document.title = pageTitle

    // Meta Description
    let metaDescriptionEl = document.querySelector('meta[name="description"]')
    let createdMeta = false
    const previousMetaContent = metaDescriptionEl?.getAttribute('content') || ''
    const shortDesc = listing.description
      ? listing.description.slice(0, 150).replace(/\s+/g, ' ').trim()
      : `Conheça ${listing.name}, ${typeLabel} localizado em ${listing.city} - ${listing.state}. Informações completas e canais de contato no Portal Viabilize.`

    if (!metaDescriptionEl) {
      metaDescriptionEl = document.createElement('meta')
      metaDescriptionEl.setAttribute('name', 'description')
      document.head.appendChild(metaDescriptionEl)
      createdMeta = true
    }
    metaDescriptionEl.setAttribute('content', `${shortDesc}...`)

    // JSON-LD structured data
    const scriptId = 'viabilize-listing-jsonld'
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!scriptEl) {
      scriptEl = document.createElement('script')
      scriptEl.id = scriptId
      scriptEl.type = 'application/ld+json'
      document.head.appendChild(scriptEl)
    }

    const schemaData =
      typeConfig.schemaType === 'LocalBusiness'
        ? {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: listing.name,
            description: listing.description,
            email: listing.email,
            telephone: listing.phone || listing.whatsapp || undefined,
            url: listing.website || window.location.href,
            address: {
              '@type': 'PostalAddress',
              streetAddress: listing.address,
              addressLocality: listing.city,
              addressRegion: listing.state,
              postalCode: listing.cep,
              addressCountry: listing.country || 'BR',
            },
            ...(listing.pinEnabled && listing.pinLat && listing.pinLng
              ? {
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: listing.pinLat,
                    longitude: listing.pinLng,
                  },
                }
              : {}),
            image: listing.photos && listing.photos.length > 0 ? listing.photos[0].url : undefined,
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: listing.name,
            description: listing.description,
            category: typeLabel,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: listing.website || window.location.href,
            },
            image: listing.photos && listing.photos.length > 0 ? listing.photos[0].url : undefined,
          }

    scriptEl.textContent = JSON.stringify(schemaData)

    return () => {
      document.title = previousTitle
      if (createdMeta && metaDescriptionEl?.parentNode) {
        metaDescriptionEl.parentNode.removeChild(metaDescriptionEl)
      } else if (metaDescriptionEl) {
        metaDescriptionEl.setAttribute('content', previousMetaContent)
      }
      const existingScript = document.getElementById(scriptId)
      if (existingScript?.parentNode) {
        existingScript.parentNode.removeChild(existingScript)
      }
    }
  }, [listing])

  // 1. Loading State (Skeleton matching layout)
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-44" />
        </div>

        {/* Gallery Skeleton */}
        <Skeleton className="w-full aspect-video sm:aspect-[21/10] rounded-2xl mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>

            <div className="space-y-3 pt-4">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="space-y-4 pt-6">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>

          {/* Contact & Map Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // 2. Not Found State
  if (isNotFound) {
    return (
      <div className="container mx-auto px-4 py-16 sm:py-24 max-w-xl text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted border mb-6 shadow-sm">
          <HelpCircle className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-3">
          Perfil não encontrado
        </h1>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed">
          O anúncio que você está procurando não existe, foi removido ou ainda não foi aprovado para
          exibição pública no diretório.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => navigate('/diretorio')}
            className="w-full sm:w-auto min-h-[44px] font-semibold gap-2"
            aria-label="Voltar para a página de busca no diretório"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao diretório
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto min-h-[44px]"
            aria-label="Ir para a página inicial"
          >
            Página inicial
          </Button>
        </div>
      </div>
    )
  }

  // 3. Error State with Retry
  if (isError || !listing) {
    return (
      <div className="container mx-auto px-4 py-16 sm:py-24 max-w-xl text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 mb-6 shadow-sm">
          <AlertCircle className="h-10 w-10" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-3">
          Não foi possível carregar o anúncio
        </h1>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed">
          Ocorreu um problema ao conectar com os servidores do Portal Viabilize. Verifique sua
          conexão e tente novamente.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => refetch()}
            className="w-full sm:w-auto min-h-[44px] font-semibold gap-2"
            aria-label="Tentar carregar anúncio novamente"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/diretorio')}
            className="w-full sm:w-auto min-h-[44px]"
            aria-label="Voltar ao diretório de empresas"
          >
            Voltar ao diretório
          </Button>
        </div>
      </div>
    )
  }

  // 4. Success State (with smooth fade-in animation)
  const typeConfig = TYPE_CONFIG[listing.type] || TYPE_CONFIG.empresa
  const TypeIcon = typeConfig.icon
  const whatsappClean = listing.whatsapp ? normalizeWhatsAppNumber(listing.whatsapp) : ''
  const phoneClean = listing.phone ? normalizeTelNumber(listing.phone) : ''
  const websiteUrl = listing.website ? ensureHttpUrl(listing.website) : ''

  const formattedDate = listing.created
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(listing.created))
    : ''

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-6xl animate-fade-in">
      {/* Navigation / Breadcrumb Bar */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center justify-between gap-4"
      >
        <Link
          to="/diretorio"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
          aria-label="Voltar à lista do diretório"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar ao diretório</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="min-h-[44px] gap-2 font-medium"
          aria-label="Compartilhar este anúncio"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
      </nav>

      {/* Photo Gallery Header */}
      <section aria-label="Galeria de fotos do anúncio" className="mb-8">
        <PhotoGallery photos={listing.photos} title={listing.name} type={listing.type} />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Listing Details & Promotions */}
        <div className="lg:col-span-8 space-y-8">
          {/* Header Block */}
          <div className="space-y-3 pb-6 border-b">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`text-xs font-semibold px-3 py-1 border shadow-xs flex items-center gap-1.5 ${typeConfig.badgeClass}`}
              >
                <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {typeConfig.label}
              </Badge>

              <Badge
                variant="outline"
                className="text-xs text-muted-foreground bg-muted/40 font-normal px-2.5 py-0.5"
              >
                <Calendar className="h-3 w-3 mr-1 inline" aria-hidden="true" />
                No portal desde {formattedDate}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {listing.name}
            </h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <span>
                {listing.address} - {listing.neighborhood ? `${listing.neighborhood}, ` : ''}
                {listing.city} - {listing.state}, {listing.cep}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <section aria-labelledby="desc-heading" className="space-y-4">
            <h2
              id="desc-heading"
              className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
            >
              Sobre a {typeConfig.label}
            </h2>
            <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-line bg-card/60 rounded-2xl p-6 border shadow-xs">
              {listing.description}
            </div>
          </section>

          {/* Promotions Section (Shown ONLY if listing has active promotions) */}
          {listing.promotions && listing.promotions.length > 0 && (
            <section aria-labelledby="promotions-heading" className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
                <h2
                  id="promotions-heading"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
                >
                  Promoções e Ofertas Ativas
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {listing.promotions.map((promo) => (
                  <Card
                    key={promo.id}
                    className="border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 via-background to-background dark:from-amber-950/20 shadow-xs"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                          <Tag
                            className="h-4 w-4 text-amber-600 dark:text-amber-400"
                            aria-hidden="true"
                          />
                          {promo.title}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-xs font-semibold"
                        >
                          Oferta
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {promo.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Interactive Map (Rendered ONLY if pinEnabled is true with coordinates) */}
          {listing.pinEnabled && listing.pinLat && listing.pinLng && (
            <section aria-labelledby="map-heading" className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2
                  id="map-heading"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
                >
                  Localização no Mapa
                </h2>
              </div>

              <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border shadow-xs bg-muted">
                <iframe
                  title={`Mapa de localização de ${listing.name}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${listing.pinLat},${listing.pinLng}&hl=pt-BR&z=15&output=embed`}
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Coordenadas: {listing.pinLat.toFixed(5)}, {listing.pinLng.toFixed(5)} (
                  {listing.city} - {listing.state})
                </span>
              </p>
            </section>
          )}
        </div>

        {/* Right Column: Contact Block & Direct Actions */}
        <aside
          aria-label="Informações de contato e atendimento"
          className="lg:col-span-4 space-y-6"
        >
          <Card className="border shadow-md rounded-2xl sticky top-20 bg-card">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-xl font-bold text-foreground">Fale Conosco</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Entre em contato direto com os responsáveis por este anúncio.
              </p>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* WhatsApp Button FIRST (Full width below 640px) */}
              {whatsappClean ? (
                <Button
                  size="lg"
                  className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 gap-2.5"
                  onClick={() =>
                    handleContactClick(
                      'whatsapp',
                      `https://wa.me/${whatsappClean}?text=${encodeURIComponent(
                        `Olá! Encontrei o perfil de ${listing.name} no Portal Viabilize e gostaria de mais informações.`,
                      )}`,
                      true,
                    )
                  }
                  aria-label={`Conversar pelo WhatsApp com ${listing.name}`}
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  <span>WhatsApp</span>
                  <span className="text-xs font-normal opacity-90 ml-auto hidden sm:inline">
                    {listing.whatsapp}
                  </span>
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  variant="outline"
                  className="w-full min-h-[48px] opacity-50 justify-start gap-2.5"
                  aria-label="WhatsApp não disponível"
                >
                  <MessageCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <span>WhatsApp não informado</span>
                </Button>
              )}

              {/* Telefone Button */}
              {phoneClean ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px] font-semibold border-border hover:bg-muted/70 transition-all focus-visible:ring-2 focus-visible:ring-primary gap-2.5"
                  onClick={() => handleContactClick('telefone', `tel:${phoneClean}`, false)}
                  aria-label={`Ligar para ${listing.name}`}
                >
                  <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span>Telefone</span>
                  <span className="text-xs font-normal text-muted-foreground ml-auto hidden sm:inline">
                    {listing.phone}
                  </span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  disabled
                  className="w-full min-h-[48px] opacity-50 justify-start gap-2.5"
                  aria-label="Telefone não informado"
                >
                  <Phone className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <span>Telefone não informado</span>
                </Button>
              )}

              {/* E-mail Button */}
              {listing.email ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px] font-semibold border-border hover:bg-muted/70 transition-all focus-visible:ring-2 focus-visible:ring-primary gap-2.5"
                  onClick={() =>
                    handleContactClick(
                      'email',
                      `mailto:${listing.email}?subject=${encodeURIComponent(
                        `Contato via Portal Viabilize: ${listing.name}`,
                      )}`,
                      false,
                    )
                  }
                  aria-label={`Enviar e-mail para ${listing.name}`}
                >
                  <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span>E-mail</span>
                  <span className="text-xs font-normal text-muted-foreground ml-auto truncate max-w-[140px] hidden sm:inline">
                    {listing.email}
                  </span>
                </Button>
              ) : null}

              {/* Site Button */}
              {websiteUrl ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px] font-semibold border-border hover:bg-muted/70 transition-all focus-visible:ring-2 focus-visible:ring-primary gap-2.5"
                  onClick={() => handleContactClick('site', websiteUrl, true)}
                  aria-label={`Visitar o site oficial de ${listing.name}`}
                >
                  <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span>Visitar Site</span>
                  <ExternalLink
                    className="h-4 w-4 text-muted-foreground ml-auto"
                    aria-hidden="true"
                  />
                </Button>
              ) : null}

              {/* Security & Verification note */}
              <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Cadastro Verificado
                </p>
                <p>
                  Os dados de contato foram fornecidos e validados no Portal Viabilize para sua
                  segurança.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
