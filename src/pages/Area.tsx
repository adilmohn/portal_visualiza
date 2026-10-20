import { useState } from 'react'
import {
  LayoutDashboard,
  User,
  Shield,
  Mail,
  Calendar,
  LogOut,
  Sparkles,
  Ticket,
  Copy,
  Check,
  PlusCircle,
  Tag,
  Building2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { usePromotionsAndVouchers, type UserListingOption } from '@/hooks/use-vouchers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { ListingModal } from '@/components/ListingModal'
import { Pencil, Star } from 'lucide-react'

export function Area() {
  const { user, signOut } = useAuth()
  const {
    promotions,
    vouchers,
    listings,
    isLoading,
    isSubmitting,
    isGenerating,
    createPromotion,
    generateVoucher,
    reload,
  } = usePromotionsAndVouchers()

  // Form state
  const [selectedListingId, setSelectedListingId] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Listing Create / Edit Modal State
  const [listingModalOpen, setListingModalOpen] = useState(false)
  const [listingToEdit, setListingToEdit] = useState<UserListingOption | null>(null)

  const handleOpenCreateListing = () => {
    setListingToEdit(null)
    setListingModalOpen(true)
  }

  const handleOpenEditListing = (listing: UserListingOption) => {
    setListingToEdit(listing)
    setListingModalOpen(true)
  }

  const handleCopyCode = async (code: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = code
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedCode(code)
      toast({
        title: 'Código copiado!',
        description: `O voucher ${code} foi copiado para sua área de transferência.`,
      })
      setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev))
      }, 2500)
    } catch (_) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código. Tente manualmente.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetListingId = selectedListingId || (listings.length > 0 ? listings[0].id : '')
    if (!targetListingId) {
      toast({
        title: 'Selecione um anúncio',
        description: 'É necessário selecionar um anúncio cadastrado para vincular a promoção.',
        variant: 'destructive',
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Informe o título da promoção.',
        variant: 'destructive',
      })
      return
    }

    if (!description.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe a descrição dos benefícios da promoção.',
        variant: 'destructive',
      })
      return
    }

    const ok = await createPromotion({
      listingId: targetListingId,
      title: title.trim(),
      description: description.trim(),
    })

    if (ok) {
      setTitle('')
      setDescription('')
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 sm:py-16 px-4 animate-fade-in space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Minha Área
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seu perfil, promoções ativas e vouchers exclusivos no Portal Viabilize.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={isLoading}
            className="gap-2 text-muted-foreground min-h-[44px]"
            aria-label="Atualizar dados da área"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="gap-2 text-muted-foreground hover:text-destructive min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da conta</span>
          </Button>
        </div>
      </div>

      {/* Account Info and Listings Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span>Dados da Conta</span>
            </CardTitle>
            <CardDescription>Informações do usuário autenticado no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> E-mail
              </span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4" /> Nome
              </span>
              <span className="font-medium text-foreground">{user?.name || 'Não informado'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Perfil / Papel
              </span>
              <Badge
                variant={user?.role === 'admin' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {user?.role || 'cadastrado'}
              </Badge>
            </div>

            {user?.created && (
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Membro desde
                </span>
                <span className="text-foreground">
                  {new Date(user.created).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Meus Anúncios ({listings.length})</span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Cadastre múltiplos serviços, produtos e empresas com a mesma conta.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={handleOpenCreateListing}
              className="gap-1.5 font-semibold text-xs min-h-[36px]"
              aria-label="Cadastrar novo anúncio"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Novo Anúncio</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Você ainda não possui anúncios cadastrados.
                </p>
                <Button
                  size="sm"
                  onClick={handleOpenCreateListing}
                  className="gap-1.5 font-semibold text-xs"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Cadastrar primeiro anúncio</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {listings.map((l) => {
                  const mainPhoto = (l.photos || []).find((p) => p.isMain) || (l.photos || [])[0]
                  return (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-sm gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {mainPhoto ? (
                          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted border shrink-0">
                            <img
                              src={mainPhoto.url}
                              alt={`Capa de ${l.name}`}
                              className="h-full w-full object-cover"
                            />
                            {mainPhoto.isMain && (
                              <div className="absolute top-0 right-0 bg-primary text-primary-foreground p-0.5 rounded-bl">
                                <Star className="h-2 w-2 fill-current" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                            <Building2 className="h-5 w-5 opacity-40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{l.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize">
                              {l.type === 'servico' ? 'Serviço' : l.type}
                            </Badge>
                            <Badge
                              variant={
                                l.status === 'aprovado'
                                  ? 'default'
                                  : l.status === 'rejeitado'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="text-[10px] py-0 px-1.5 capitalize"
                            >
                              {l.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditListing(l)}
                        className="gap-1 min-h-[36px] text-xs font-medium shrink-0"
                        aria-label={`Editar anúncio ${l.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promotions & Vouchers Section */}
      <div className="space-y-6 pt-4 border-t border-border">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Promoções e Vouchers
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Crie ofertas promocionais para seus anúncios e gere códigos de voucher exclusivos para
            seus clientes utilizarem.
          </p>
        </div>

        {/* Create Promotion Form */}
        <Card className="border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/30 via-card to-card dark:from-amber-950/10 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span>Nova Promoção</span>
            </CardTitle>
            <CardDescription>
              Adicione uma promoção ativa que ficará visível publicamente no seu anúncio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listings.length === 0 && !isLoading ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                É necessário ter pelo menos um anúncio cadastrado para criar promoções.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {listings.length > 1 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="listing-select" className="text-sm font-medium">
                      Anúncio
                    </Label>
                    <select
                      id="listing-select"
                      value={selectedListingId || (listings[0]?.id ?? '')}
                      onChange={(e) => setSelectedListingId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {listings.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="promo-title" className="text-sm font-medium">
                    Título da Promoção *
                  </Label>
                  <Input
                    id="promo-title"
                    type="text"
                    placeholder="Ex: 20% de Desconto na Primeira Compra"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                    className="min-h-[44px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="promo-description" className="text-sm font-medium">
                    Descrição da Promoção *
                  </Label>
                  <Textarea
                    id="promo-description"
                    placeholder="Descreva as condições, vantagens e como o cliente pode aproveitar a oferta..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className="min-h-[44px] gap-2 font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4" />
                        <span>Criar Promoção</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Promotions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <span>Promoções Ativas ({promotions.length})</span>
            </h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : promotions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground text-sm space-y-1">
                <Tag className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="font-medium text-foreground">Nenhuma promoção ativa</p>
                <p className="text-xs">
                  Utilize o formulário acima para cadastrar a primeira promoção dos seus anúncios.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {promotions.map((promo) => {
                const promoVouchers = vouchers.filter((v) => v.promotionId === promo.id)
                const isThisGenerating = isGenerating === promo.id
                const listingName =
                  promo.expand?.listingId?.name ||
                  listings.find((l) => l.id === promo.listingId)?.name ||
                  'Anúncio vinculado'

                return (
                  <Card
                    key={promo.id}
                    className="border-border/80 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-bold text-foreground">
                            {promo.title}
                          </CardTitle>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {listingName}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-xs shrink-0"
                        >
                          Ativa
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-foreground/80 line-clamp-3 mt-2">
                        {promo.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      {/* Vouchers list for this promotion */}
                      {promoVouchers.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/50">
                          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Ticket className="h-3.5 w-3.5 text-primary" />
                            Códigos de Voucher Gerados:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {promoVouchers.map((v) => {
                              const isCopied = copiedCode === v.code
                              return (
                                <div
                                  key={v.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary"
                                >
                                  <span>{v.code}</span>
                                  {v.used && (
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-muted text-muted-foreground">
                                      usado
                                    </span>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCopyCode(v.code)}
                                    className="h-6 w-6 ml-0.5 hover:bg-primary/20"
                                    title="Copiar código"
                                    aria-label={`Copiar código ${v.code}`}
                                  >
                                    {isCopied ? (
                                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action to generate voucher */}
                      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {promoVouchers.length === 0
                            ? 'Nenhum voucher gerado'
                            : `${promoVouchers.length} voucher(s) criado(s)`}
                        </span>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => generateVoucher(promo.listingId, promo.id)}
                          disabled={isThisGenerating}
                          className="min-h-[44px] gap-2 font-medium border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-foreground"
                          aria-label={`Gerar voucher para a promoção ${promo.title}`}
                        >
                          {isThisGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                              <span>Gerando...</span>
                            </>
                          ) : (
                            <>
                              <Ticket className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <span>Gerar Voucher</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {/* Modal for Creating / Editing Listing */}
      <ListingModal
        open={listingModalOpen}
        onOpenChange={setListingModalOpen}
        listingToEdit={listingToEdit}
        userId={user?.id || ''}
        onSaved={reload}
      />
    </div>
  )
}

export default Area
