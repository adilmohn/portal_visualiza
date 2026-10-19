import { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  PowerOff,
  AlertCircle,
  Building,
  Activity,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Eye,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  History,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Coins, Star, MessageSquare } from 'lucide-react'
import { useAdminQueue } from '@/hooks/use-admin-queue'
import { useAdminMetrics } from '@/hooks/use-admin-metrics'
import { useAdminReviews } from '@/hooks/use-admin-reviews'
import { AdminMonetization } from '@/components/admin/AdminMonetization'
import type { AdminListingItem } from '@/services/admin'

export default function Admin() {
  const {
    pendingListings,
    approvedListings,
    approvedTotal,
    approvedPage,
    approvedTotalPages,
    isLoadingPending,
    isLoadingApproved,
    isActionLoading,
    actionListingId,
    refetchPending,
    refetchApproved,
    handleApprove,
    handleReject,
    handleDeactivate,
  } = useAdminQueue()

  const {
    metrics,
    auditTrail,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useAdminMetrics()

  const {
    pendingReviews,
    isLoading: isLoadingReviews,
    isActionLoading: isReviewActionLoading,
    actionReviewId,
    refetch: refetchReviews,
    handleApprove: handleApproveReview,
    handleReject: handleRejectReview,
  } = useAdminReviews()

  // State for Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AdminListingItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)

  // State for Deactivate Modal
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<AdminListingItem | null>(null)
  const [deactivateReason, setDeactivateReason] = useState('')

  // State for Detail Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewTarget, setPreviewTarget] = useState<AdminListingItem | null>(null)

  // Search filter for approved listings
  const [searchTerm, setSearchTerm] = useState('')

  const handleOpenReject = (listing: AdminListingItem) => {
    setRejectTarget(listing)
    setRejectReason('')
    setRejectError(null)
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!rejectTarget) return
    const trimmed = rejectReason.trim()
    if (!trimmed) {
      setRejectError('Por favor, informe o motivo da rejeição para orientar o anunciante.')
      return
    }

    const success = await handleReject(rejectTarget.id, trimmed)
    if (success) {
      setRejectModalOpen(false)
      setRejectTarget(null)
      setRejectReason('')
    }
  }

  const handleOpenDeactivate = (listing: AdminListingItem) => {
    setDeactivateTarget(listing)
    setDeactivateReason('')
    setDeactivateModalOpen(true)
  }

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return
    const success = await handleDeactivate(
      deactivateTarget.id,
      deactivateReason.trim() || undefined,
    )
    if (success) {
      setDeactivateModalOpen(false)
      setDeactivateTarget(null)
    }
  }

  const handleOpenPreview = (listing: AdminListingItem) => {
    setPreviewTarget(listing)
    setPreviewModalOpen(true)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    refetchApproved(1, searchTerm)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > approvedTotalPages) return
    refetchApproved(newPage, searchTerm)
  }

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Painel Administrativo
              </h1>
              <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                Admin
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fila de moderação, gestão de anúncios e métricas do Portal Viabilize.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchPending()
            refetchApproved(approvedPage, searchTerm)
            refetchMetrics()
            refetchReviews()
          }}
          className="gap-2 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-muted-foreground hover:text-foreground focus-visible:ring-2"
          aria-label="Atualizar todos os dados"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar dados</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Pending */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anúncios Pendentes</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {metrics?.totalPending ?? pendingListings.length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Aguardando moderação</p>
          </CardContent>
        </Card>

        {/* Card 2: Approved */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anúncios Aprovados</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {metrics?.totalApproved ?? approvedTotal}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Ativos no diretório público</p>
          </CardContent>
        </Card>

        {/* Card 3: Contact Events 30d */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos (Últimos 30 dias)</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {metrics?.contactEvents30d.total ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Interações diretas de clientes</p>
          </CardContent>
        </Card>

        {/* Card 4: Channels breakdown */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canais Mais Acessados</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MessageCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="flex flex-wrap gap-2 text-xs pt-0.5">
                <span className="inline-flex items-center gap-1 font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded">
                  <MessageCircle className="h-3 w-3" />
                  Whats: {metrics?.contactEvents30d.byChannel.whatsapp ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded">
                  <Phone className="h-3 w-3" />
                  Tel: {metrics?.contactEvents30d.byChannel.telefone ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 px-2 py-0.5 rounded">
                  <Mail className="h-3 w-3" />
                  E-mail: {metrics?.contactEvents30d.byChannel.email ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded">
                  <Globe className="h-3 w-3" />
                  Site: {metrics?.contactEvents30d.byChannel.site ?? 0}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Fila de Moderação, Avaliações, Anúncios Aprovados, Monetização, Auditoria */}
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 max-w-3xl h-auto sm:h-12 p-1 bg-muted gap-1">
          <TabsTrigger
            value="queue"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm min-h-[40px] focus-visible:ring-2"
          >
            <span>Fila Anúncios</span>
            {pendingListings.length > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px] rounded-full">
                {pendingListings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm min-h-[40px] focus-visible:ring-2"
          >
            <Star className="h-3.5 w-3.5" />
            <span>Avaliações</span>
            {pendingReviews.length > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px] rounded-full">
                {pendingReviews.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm min-h-[40px] focus-visible:ring-2"
          >
            <span>Aprovados</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full">
              {approvedTotal}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="monetizacao"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm min-h-[40px] focus-visible:ring-2"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Monetização</span>
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm min-h-[40px] focus-visible:ring-2"
          >
            <History className="h-3.5 w-3.5" />
            <span>Auditoria</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENDING QUEUE */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>Fila de Aprovação de Anúncios</span>
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-300 text-amber-700 dark:text-amber-400"
                    >
                      Atualização em tempo real ativa
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Revise cada anúncio submetido antes de publicar no diretório do Portal
                    Viabilize.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPending ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <Skeleton className="h-16 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingListings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-base">Nenhuma pendência</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Todos os cadastros enviados já foram revisados e moderados pela equipe
                    administrativa.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingListings.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors space-y-4"
                    >
                      {/* Listing Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                            <Badge variant="secondary" className="capitalize text-xs font-semibold">
                              {item.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300"
                            >
                              Pendente
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Cadastrado em {new Date(item.created).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPreview(item)}
                            className="min-h-[44px] sm:min-h-[36px] gap-1.5 focus-visible:ring-2"
                            aria-label={`Ver detalhes de ${item.name}`}
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver detalhes</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReject(item)}
                            disabled={isActionLoading && actionListingId === item.id}
                            className="min-h-[44px] sm:min-h-[36px] gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2"
                            aria-label={`Rejeitar anúncio ${item.name}`}
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Rejeitar</span>
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(item.id)}
                            disabled={isActionLoading && actionListingId === item.id}
                            className="min-h-[44px] sm:min-h-[36px] gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-2"
                            aria-label={`Aprovar anúncio ${item.name}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>
                              {isActionLoading && actionListingId === item.id
                                ? 'Aprovando...'
                                : 'Aprovar'}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Main Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-border/50">
                        {/* Photo Thumbnail */}
                        <div className="md:col-span-1">
                          {item.photos && item.photos.length > 0 ? (
                            <div className="relative aspect-video sm:aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                              <img
                                src={item.photos[0].url}
                                alt={`Foto de ${item.name}`}
                                className="w-full h-full object-cover"
                              />
                              {item.photos.length > 1 && (
                                <Badge className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white">
                                  +{item.photos.length - 1} foto
                                  {item.photos.length - 1 > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="aspect-video sm:aspect-square rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground p-3 text-center border border-dashed border-border">
                              <Building className="h-8 w-8 mb-1 opacity-50" />
                              <span className="text-xs">Sem foto anexada</span>
                            </div>
                          )}
                        </div>

                        {/* Description & Fields */}
                        <div className="md:col-span-3 space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Descrição:
                            </span>
                            <p className="text-sm text-foreground mt-0.5 line-clamp-3 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">
                                {item.city} - {item.state} ({item.neighborhood || 'Bairro n/i'})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{item.email}</span>
                            </div>
                            {item.phone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{item.phone}</span>
                              </div>
                            )}
                            {item.whatsapp && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MessageCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>WhatsApp: {item.whatsapp}</span>
                              </div>
                            )}
                            {item.website && (
                              <div className="flex items-center gap-1.5 text-muted-foreground col-span-1 sm:col-span-2">
                                <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                                <a
                                  href={item.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate inline-flex items-center gap-1"
                                >
                                  {item.website}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: REVIEWS MODERATION QUEUE */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span>Fila de Moderação de Avaliações</span>
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-300 text-amber-700 dark:text-amber-400"
                    >
                      Atualização em tempo real ativa
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Avaliações enviadas por usuários que aguardam aprovação para exibição pública na
                    página do anúncio.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingReviews ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-xl border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingReviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-base">
                    Nenhuma avaliação pendente
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Todas as avaliações submetidas por usuários já foram moderadas pela equipe.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base text-foreground">
                              {rev.listingName || 'Anúncio'}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300"
                            >
                              Pendente
                            </Badge>
                            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${
                                    s <= rev.stars
                                      ? 'text-amber-500 fill-amber-500'
                                      : 'text-muted-foreground/30'
                                  }`}
                                  aria-hidden="true"
                                />
                              ))}
                              <span className="text-xs font-bold text-amber-600 ml-1">
                                {rev.stars}/5
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              Avaliador: <strong>{rev.userName}</strong>
                            </span>
                            {rev.userEmail && <span>({rev.userEmail})</span>}
                            <span>
                              • Enviado em {new Date(rev.created).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {/* Botões Aprovar e Rejeitar */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectReview(rev.id)}
                            disabled={isReviewActionLoading && actionReviewId === rev.id}
                            className="min-h-[44px] sm:min-h-[36px] gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2"
                            aria-label={`Rejeitar avaliação de ${rev.userName}`}
                          >
                            <XCircle className="h-4 w-4" />
                            <span>
                              {isReviewActionLoading && actionReviewId === rev.id
                                ? 'Rejeitando...'
                                : 'Rejeitar'}
                            </span>
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveReview(rev.id)}
                            disabled={isReviewActionLoading && actionReviewId === rev.id}
                            className="min-h-[44px] sm:min-h-[36px] gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-2"
                            aria-label={`Aprovar avaliação de ${rev.userName}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>
                              {isReviewActionLoading && actionReviewId === rev.id
                                ? 'Aprovando...'
                                : 'Aprovar'}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Review Comment */}
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                          Comentário:
                        </span>
                        {rev.comment ? (
                          <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border leading-relaxed">
                            {rev.comment}
                          </p>
                        ) : (
                          <p className="text-xs italic text-muted-foreground">
                            Sem comentário textual (apenas nota em estrelas).
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: APPROVED LIST */}
        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Anúncios Aprovados e Ativos</CardTitle>
                  <CardDescription>
                    Gerencie os cadastros publicados e ativos no diretório público.
                  </CardDescription>
                </div>

                {/* Search Bar */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center gap-2 max-w-sm w-full"
                >
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por nome, cidade ou UF..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-11 sm:h-9"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    className="h-11 sm:h-9 min-h-[44px] sm:min-h-0"
                  >
                    Buscar
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingApproved ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : approvedListings.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  Nenhum anúncio aprovado encontrado com os filtros aplicados.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table view (hidden on md and down) */}
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Anúncio</th>
                          <th className="py-3 px-4">Tipo</th>
                          <th className="py-3 px-4">Localização</th>
                          <th className="py-3 px-4">Contato</th>
                          <th className="py-3 px-4">Data Aprovação</th>
                          <th className="py-3 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {approvedListings.map((listing) => (
                          <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-medium text-foreground">
                              <div className="font-semibold">{listing.name}</div>
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                {listing.description}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="capitalize text-xs">
                                {listing.type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {listing.city} - {listing.state}
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              <div>{listing.email}</div>
                              {listing.whatsapp && (
                                <div className="text-emerald-600">Whats: {listing.whatsapp}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {new Date(listing.created).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDeactivate(listing)}
                                disabled={isActionLoading && actionListingId === listing.id}
                                className="min-h-[44px] sm:min-h-[36px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-300 focus-visible:ring-2"
                                aria-label={`Desativar anúncio ${listing.name}`}
                              >
                                <PowerOff className="h-4 w-4 mr-1.5" />
                                <span>Desativar</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile & Tablet Card view (shown below md breakpoint) */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {approvedListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="p-4 rounded-xl border border-border bg-card space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-foreground text-base">{listing.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {listing.city} - {listing.state}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs">
                            {listing.type}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {listing.description}
                        </p>

                        <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
                          <span>E-mail: {listing.email}</span>
                          {listing.whatsapp && <span>WhatsApp: {listing.whatsapp}</span>}
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeactivate(listing)}
                            disabled={isActionLoading && actionListingId === listing.id}
                            className="w-full min-h-[44px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-300 focus-visible:ring-2"
                            aria-label={`Desativar anúncio ${listing.name}`}
                          >
                            <PowerOff className="h-4 w-4 mr-1.5" />
                            <span>Desativar Anúncio</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {approvedTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Página {approvedPage} de {approvedTotalPages} ({approvedTotal} anúncios)
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(approvedPage - 1)}
                          disabled={approvedPage <= 1}
                          className="min-h-[44px] sm:min-h-[36px] min-w-[44px] px-2 focus-visible:ring-2"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(approvedPage + 1)}
                          disabled={approvedPage >= approvedTotalPages}
                          className="min-h-[44px] sm:min-h-[36px] min-w-[44px] px-2 focus-visible:ring-2"
                          aria-label="Próxima página"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: MONETIZAÇÃO */}
        <TabsContent value="monetizacao" className="space-y-4">
          <AdminMonetization />
        </TabsContent>

        {/* TAB 4: AUDIT TRAIL */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <span>Trilha de Auditoria Administrativa (auditLog)</span>
              </CardTitle>
              <CardDescription>
                Registro permanente e seguro de todas as ações executadas por administradores no
                sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMetrics ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded" />
                  ))}
                </div>
              ) : auditTrail.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  Nenhum registro de auditoria gravado até o momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditTrail.map((log) => {
                    let actionBadgeColor =
                      'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    let actionLabel = log.action

                    if (log.action === 'approve') {
                      actionBadgeColor =
                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      actionLabel = 'Aprovou Anúncio'
                    } else if (log.action === 'reject') {
                      actionBadgeColor =
                        'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      actionLabel = 'Rejeitou Anúncio'
                    } else if (log.action === 'deactivate') {
                      actionBadgeColor =
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      actionLabel = 'Desativou Anúncio'
                    } else if (log.action === 'approve_review') {
                      actionBadgeColor =
                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      actionLabel = 'Aprovou Avaliação'
                    } else if (log.action === 'reject_review') {
                      actionBadgeColor =
                        'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      actionLabel = 'Rejeitou Avaliação'
                    }

                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-lg border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm bg-card"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${actionBadgeColor}`}
                            >
                              {actionLabel}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              ID Alvo: {log.targetId}
                            </span>
                            {log.adminEmail && (
                              <span className="text-xs text-muted-foreground">
                                por {log.adminEmail}
                              </span>
                            )}
                          </div>
                          {log.reason && (
                            <p className="text-xs text-foreground/80 bg-muted/40 p-2 rounded mt-1 border border-border/40">
                              <strong className="font-semibold">Motivo:</strong> {log.reason}
                            </p>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: REJECT LISTING WITH REASON */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <span>Rejeitar Anúncio</span>
            </DialogTitle>
            <DialogDescription>
              Informe o motivo detalhado da rejeição para que o proprietário do anúncio{' '}
              <strong>{rejectTarget?.name}</strong> possa corrigir as pendências.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason" className="text-xs font-semibold">
                Motivo da Rejeição <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                rows={4}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value)
                  if (rejectError) setRejectError(null)
                }}
                placeholder="Exemplo: As informações de contato e o endereço físico não puderam ser verificados. Por favor envie um comprovante válido."
                className="resize-none focus-visible:ring-2"
              />
              {rejectError && <p className="text-xs text-destructive">{rejectError}</p>}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Este motivo será gravado no anúncio, registrado na auditoria e exibido ao anunciante.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isActionLoading}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              {isActionLoading ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DEACTIVATE LISTING */}
      <Dialog open={deactivateModalOpen} onOpenChange={setDeactivateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <PowerOff className="h-5 w-5" />
              <span>Desativar Anúncio</span>
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar <strong>{deactivateTarget?.name}</strong>? O anúncio
              deixará de ser exibido no diretório público.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="deactivate-reason" className="text-xs font-semibold">
                Observação / Motivo (Opcional)
              </Label>
              <Input
                id="deactivate-reason"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Exemplo: Solicitação do proprietário por e-mail"
                className="focus-visible:ring-2 h-11 sm:h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivateModalOpen(false)}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeactivate}
              disabled={isActionLoading}
              className="min-h-[44px] sm:min-h-[36px] bg-amber-600 hover:bg-amber-700"
            >
              {isActionLoading ? 'Desativando...' : 'Confirmar Desativação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETAIL PREVIEW */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl">{previewTarget?.name}</DialogTitle>
              <Badge variant="outline" className="capitalize text-xs">
                {previewTarget?.type}
              </Badge>
            </div>
            <DialogDescription>
              Visualização completa dos dados informados para moderação.
            </DialogDescription>
          </DialogHeader>

          {previewTarget && (
            <div className="space-y-4 py-2 text-sm">
              {/* Photos Gallery */}
              {previewTarget.photos && previewTarget.photos.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Fotos Anexadas ({previewTarget.photos.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {previewTarget.photos.map((p, idx) => (
                      <a
                        key={p.id}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-video rounded-lg overflow-hidden border border-border group"
                      >
                        <img
                          src={p.url}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                          Ampliar <ExternalLink className="h-3 w-3 ml-1" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Descrição Completa
                </span>
                <p className="p-3 rounded-lg bg-muted/40 border border-border/50 text-foreground text-sm whitespace-pre-wrap leading-relaxed">
                  {previewTarget.description}
                </p>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block">E-mail:</span>
                  <span className="font-medium text-foreground">{previewTarget.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Telefone:</span>
                  <span className="font-medium text-foreground">
                    {previewTarget.phone || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">WhatsApp:</span>
                  <span className="font-medium text-foreground">
                    {previewTarget.whatsapp || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Website:</span>
                  <span className="font-medium text-foreground">
                    {previewTarget.website || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">CEP / Endereço:</span>
                  <span className="font-medium text-foreground">
                    {previewTarget.cep} - {previewTarget.address}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Localidade:</span>
                  <span className="font-medium text-foreground">
                    {previewTarget.neighborhood ? `${previewTarget.neighborhood}, ` : ''}
                    {previewTarget.city} - {previewTarget.state}
                  </span>
                </div>
              </div>

              {previewTarget.rejectedReason && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs">
                  <strong>Motivo de rejeição anterior:</strong> {previewTarget.rejectedReason}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewModalOpen(false)}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Fechar
            </Button>
            {previewTarget && previewTarget.status === 'pendente' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPreviewModalOpen(false)
                    handleOpenReject(previewTarget)
                  }}
                  className="min-h-[44px] sm:min-h-[36px] text-destructive border-destructive/40"
                >
                  Rejeitar
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={async () => {
                    const success = await handleApprove(previewTarget.id)
                    if (success) setPreviewModalOpen(false)
                  }}
                  className="min-h-[44px] sm:min-h-[36px] bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Aprovar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
