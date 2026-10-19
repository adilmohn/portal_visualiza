import { useState } from 'react'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  Clock,
  ExternalLink,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMonetization } from '@/hooks/use-monetization'
import {
  MEDIA_TYPE_LABELS,
  PERIOD_LABELS,
  PACKAGE_STATUS_LABELS,
  SALE_STATUS_LABELS,
  type PackageItem,
  type PackageMediaType,
  type PackagePeriod,
  type PackageStatus,
  type PackageFormData,
  type SaleFormData,
  type SaleStatus,
} from '@/services/monetization'

export function AdminMonetization() {
  const {
    packages,
    sales,
    billingMetrics,
    isLoadingPackages,
    isLoadingSales,
    isSubmittingPackage,
    isSubmittingSale,
    handleCreatePackage,
    handleUpdatePackage,
    handleDeletePackage,
    handleCreateSale,
    handleUpdateSaleStatus,
  } = useMonetization()

  // Package Form / Modal state
  const [packageModalOpen, setPackageModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null)
  const [packageFormData, setPackageFormData] = useState<PackageFormData>({
    name: '',
    mediaType: 'destaque_diretorio',
    period: 'mensal',
    price: 0,
    status: 'ativo',
  })
  const [packageFormError, setPackageFormError] = useState<string | null>(null)

  // Package Delete Confirmation Modal
  const [deletePackageModalOpen, setDeletePackageModalOpen] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<PackageItem | null>(null)

  // Sale Modal state
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    packageId: '',
    advertiserName: '',
    advertiserEmail: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    amount: 0,
    status: 'ativa',
  })
  const [saleFormError, setSaleFormError] = useState<string | null>(null)

  // Handlers for Package CRUD
  const handleOpenCreatePackage = () => {
    setEditingPackage(null)
    setPackageFormData({
      name: '',
      mediaType: 'destaque_diretorio',
      period: 'mensal',
      price: 0,
      status: 'ativo',
    })
    setPackageFormError(null)
    setPackageModalOpen(true)
  }

  const handleOpenEditPackage = (pkg: PackageItem) => {
    setEditingPackage(pkg)
    setPackageFormData({
      name: pkg.name,
      mediaType: pkg.mediaType,
      period: pkg.period,
      price: pkg.price,
      status: pkg.status,
    })
    setPackageFormError(null)
    setPackageModalOpen(true)
  }

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!packageFormData.name.trim()) {
      setPackageFormError('O nome do pacote é obrigatório.')
      return
    }
    if (packageFormData.price < 0 || isNaN(packageFormData.price)) {
      setPackageFormError('Informe um valor de preço válido.')
      return
    }

    if (editingPackage) {
      const ok = await handleUpdatePackage(editingPackage.id, packageFormData)
      if (ok) {
        setPackageModalOpen(false)
        setEditingPackage(null)
      }
    } else {
      const ok = await handleCreatePackage(packageFormData)
      if (ok) {
        setPackageModalOpen(false)
      }
    }
  }

  const handleOpenDeletePackage = (pkg: PackageItem) => {
    setPackageToDelete(pkg)
    setDeletePackageModalOpen(true)
  }

  const handleConfirmDeletePackage = async () => {
    if (!packageToDelete) return
    const ok = await handleDeletePackage(packageToDelete.id)
    if (ok) {
      setDeletePackageModalOpen(false)
      setPackageToDelete(null)
    }
  }

  // Handlers for Sales Registration
  const handleOpenCreateSale = () => {
    const activePackages = packages.filter((p) => p.status === 'ativo')
    const firstActive = activePackages[0]
    setSaleFormData({
      packageId: firstActive ? firstActive.id : '',
      advertiserName: '',
      advertiserEmail: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      amount: firstActive ? firstActive.price : 0,
      status: 'ativa',
    })
    setSaleFormError(null)
    setSaleModalOpen(true)
  }

  const handlePackageSelectForSale = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId)
    setSaleFormData((prev) => ({
      ...prev,
      packageId: pkgId,
      amount: pkg ? pkg.price : prev.amount,
    }))
  }

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saleFormData.packageId) {
      setSaleFormError('Selecione um pacote ativo.')
      return
    }
    if (!saleFormData.advertiserName.trim()) {
      setSaleFormError('Informe o nome do anunciante.')
      return
    }
    if (!saleFormData.advertiserEmail.trim() || !saleFormData.advertiserEmail.includes('@')) {
      setSaleFormError('Informe um e-mail válido para o anunciante.')
      return
    }
    if (!saleFormData.startDate) {
      setSaleFormError('Informe a data de início da veiculação.')
      return
    }
    if (saleFormData.amount < 0 || isNaN(saleFormData.amount)) {
      setSaleFormError('Informe um valor de cobrança válido.')
      return
    }

    const ok = await handleCreateSale(saleFormData)
    if (ok) {
      setSaleModalOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs: Catálogo, Vendas, Faturamento */}
      <Tabs defaultValue="catalogo" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md h-12 p-1 bg-muted">
          <TabsTrigger
            value="catalogo"
            className="flex items-center gap-2 text-xs sm:text-sm min-h-[40px] focus-visible:ring-2"
          >
            <Package className="h-4 w-4" />
            <span>Catálogo</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full">
              {packages.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="vendas"
            className="flex items-center gap-2 text-xs sm:text-sm min-h-[40px] focus-visible:ring-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Vendas</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-full">
              {sales.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="faturamento"
            className="flex items-center gap-2 text-xs sm:text-sm min-h-[40px] focus-visible:ring-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Faturamento</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* SUB-TAB 1: CATÁLOGO */}
        {/* ========================================================================= */}
        <TabsContent value="catalogo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span>Catálogo de Pacotes de Mídia</span>
                  </CardTitle>
                  <CardDescription>
                    Gerencie os planos publicitários oferecidos no Portal Viabilize e expostos na
                    página pública de planos.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/planos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 min-h-[44px] sm:min-h-[36px] transition-colors"
                  >
                    <span>Ver página pública</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <Button
                    onClick={handleOpenCreatePackage}
                    className="gap-2 min-h-[44px] sm:min-h-[36px] bg-primary text-primary-foreground focus-visible:ring-2"
                    aria-label="Criar novo pacote de publicidade"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Pacote</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPackages ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : packages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Package className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-base">
                    Nenhum pacote cadastrado
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Cadastre o primeiro pacote de publicidade para começar a monetizar o portal e
                    oferecer destaques para anunciantes.
                  </p>
                  <Button
                    onClick={handleOpenCreatePackage}
                    variant="outline"
                    className="mt-2 min-h-[44px]"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Criar primeiro pacote
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Nome do Pacote</th>
                          <th className="py-3 px-4">Tipo de Mídia</th>
                          <th className="py-3 px-4">Período / Cobrança</th>
                          <th className="py-3 px-4">Preço (R$)</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {packages.map((pkg) => (
                          <tr key={pkg.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-semibold text-foreground">{pkg.name}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-xs">
                                {MEDIA_TYPE_LABELS[pkg.mediaType]}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {PERIOD_LABELS[pkg.period]}
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-foreground">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(pkg.price)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={pkg.status === 'ativo' ? 'default' : 'secondary'}
                                className={
                                  pkg.status === 'ativo'
                                    ? 'bg-emerald-600 text-white text-xs'
                                    : 'text-xs'
                                }
                              >
                                {PACKAGE_STATUS_LABELS[pkg.status]}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditPackage(pkg)}
                                  className="min-h-[44px] sm:min-h-[36px] h-9 px-2.5 text-muted-foreground hover:text-foreground"
                                  aria-label={`Editar pacote ${pkg.name}`}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  <span>Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDeletePackage(pkg)}
                                  className="min-h-[44px] sm:min-h-[36px] h-9 px-2.5 text-destructive hover:bg-destructive/10"
                                  aria-label={`Excluir pacote ${pkg.name}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  <span>Excluir</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-4 rounded-xl border border-border bg-card space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-foreground text-base">{pkg.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {PERIOD_LABELS[pkg.period]}
                            </p>
                          </div>
                          <Badge
                            variant={pkg.status === 'ativo' ? 'default' : 'secondary'}
                            className={
                              pkg.status === 'ativo'
                                ? 'bg-emerald-600 text-white text-xs'
                                : 'text-xs'
                            }
                          >
                            {PACKAGE_STATUS_LABELS[pkg.status]}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                          <span className="text-muted-foreground">
                            {MEDIA_TYPE_LABELS[pkg.mediaType]}
                          </span>
                          <span className="font-mono font-bold text-sm text-foreground">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(pkg.price)}
                          </span>
                        </div>

                        <div className="pt-2 flex items-center gap-2 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="flex-1 min-h-[44px]"
                            aria-label={`Editar ${pkg.name}`}
                          >
                            <Edit2 className="h-4 w-4 mr-1.5" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeletePackage(pkg)}
                            className="flex-1 min-h-[44px] text-destructive border-destructive/30 hover:bg-destructive/10"
                            aria-label={`Excluir ${pkg.name}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* SUB-TAB 2: VENDAS */}
        {/* ========================================================================= */}
        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span>Registro e Gestão de Vendas</span>
                  </CardTitle>
                  <CardDescription>
                    Registre contratos e veiculações de anunciantes vinculados a pacotes do
                    catálogo.
                  </CardDescription>
                </div>

                <Button
                  onClick={handleOpenCreateSale}
                  disabled={packages.filter((p) => p.status === 'ativo').length === 0}
                  className="gap-2 min-h-[44px] sm:min-h-[36px] bg-primary text-primary-foreground focus-visible:ring-2"
                  aria-label="Registrar nova venda de publicidade"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Venda</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {packages.filter((p) => p.status === 'ativo').length === 0 && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-300 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    É necessário ter ao menos um pacote com status <strong>Ativo</strong> no
                    catálogo para registrar novas vendas.
                  </span>
                </div>
              )}

              {isLoadingSales ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : sales.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-base">
                    Nenhuma venda registrada
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Ainda não há vendas de pacotes cadastradas. Registre contratações de anunciantes
                    para acompanhar o faturamento.
                  </p>
                  <Button
                    onClick={handleOpenCreateSale}
                    disabled={packages.filter((p) => p.status === 'ativo').length === 0}
                    variant="outline"
                    className="mt-2 min-h-[44px]"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Registrar primeira venda
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Anunciante</th>
                          <th className="py-3 px-4">Pacote</th>
                          <th className="py-3 px-4">Período de Veiculação</th>
                          <th className="py-3 px-4">Valor Cobrado</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Alterar Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground">
                                {sale.advertiserName}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {sale.advertiserEmail}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-xs">
                                {sale.packageName || sale.expand?.packageId?.name || 'Pacote (n/i)'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-primary" />
                                <span>
                                  Início: {new Date(sale.startDate).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              {sale.endDate ? (
                                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                                  Término: {new Date(sale.endDate).toLocaleDateString('pt-BR')}
                                </div>
                              ) : (
                                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                                  Término: Indeterminado
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-foreground">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(sale.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  sale.status === 'ativa'
                                    ? 'default'
                                    : sale.status === 'encerrada'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                                className={
                                  sale.status === 'ativa'
                                    ? 'bg-emerald-600 text-white text-xs'
                                    : 'text-xs'
                                }
                              >
                                {SALE_STATUS_LABELS[sale.status]}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Select
                                value={sale.status}
                                onValueChange={(val) =>
                                  handleUpdateSaleStatus(sale.id, val as SaleStatus)
                                }
                                disabled={isSubmittingSale}
                              >
                                <SelectTrigger className="w-32 h-9 text-xs ml-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ativa">Ativa</SelectItem>
                                  <SelectItem value="encerrada">Encerrada</SelectItem>
                                  <SelectItem value="cancelada">Cancelada</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {sales.map((sale) => (
                      <div
                        key={sale.id}
                        className="p-4 rounded-xl border border-border bg-card space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-foreground text-base">
                              {sale.advertiserName}
                            </h4>
                            <p className="text-xs text-muted-foreground">{sale.advertiserEmail}</p>
                          </div>
                          <Badge
                            variant={
                              sale.status === 'ativa'
                                ? 'default'
                                : sale.status === 'encerrada'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={
                              sale.status === 'ativa'
                                ? 'bg-emerald-600 text-white text-xs'
                                : 'text-xs'
                            }
                          >
                            {SALE_STATUS_LABELS[sale.status]}
                          </Badge>
                        </div>

                        <div className="text-xs space-y-1 text-muted-foreground pt-1 border-t border-border/50">
                          <div className="flex justify-between">
                            <span>Pacote:</span>
                            <span className="font-medium text-foreground">
                              {sale.packageName || sale.expand?.packageId?.name || 'Pacote (n/i)'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Início:</span>
                            <span>{new Date(sale.startDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {sale.endDate && (
                            <div className="flex justify-between">
                              <span>Término:</span>
                              <span>{new Date(sale.endDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-border/50 text-sm font-bold text-foreground font-mono">
                            <span>Valor:</span>
                            <span>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(sale.amount)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Mudar status:</Label>
                          <Select
                            value={sale.status}
                            onValueChange={(val) =>
                              handleUpdateSaleStatus(sale.id, val as SaleStatus)
                            }
                            disabled={isSubmittingSale}
                          >
                            <SelectTrigger className="w-full h-11 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativa">Ativa</SelectItem>
                              <SelectItem value="encerrada">Encerrada</SelectItem>
                              <SelectItem value="cancelada">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* SUB-TAB 3: FATURAMENTO */}
        {/* ========================================================================= */}
        <TabsContent value="faturamento" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Ativo */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ativo</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(billingMetrics.totalAtivo)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {billingMetrics.totalAtivoCount}{' '}
                  {billingMetrics.totalAtivoCount === 1
                    ? 'veiculação ativa no momento'
                    : 'veiculações ativas no momento'}
                </p>
              </CardContent>
            </Card>

            {/* Cobranças Emitidas */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cobranças Emitidas</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Receipt className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(billingMetrics.cobrancasEmitidas)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {billingMetrics.emitidasCount}{' '}
                  {billingMetrics.emitidasCount === 1
                    ? 'venda gerada total'
                    : 'vendas geradas totais'}
                </p>
              </CardContent>
            </Card>

            {/* Cobranças Pagas */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cobranças Pagas</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(billingMetrics.cobrancasPagas)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {billingMetrics.pagasCount}{' '}
                  {billingMetrics.pagasCount === 1
                    ? 'contrato quitado/ativo'
                    : 'contratos quitados/ativos'}
                </p>
              </CardContent>
            </Card>

            {/* Cobranças Vencidas / Encerradas */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cobranças Vencidas</CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(billingMetrics.cobrancasVencidas)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {billingMetrics.vencidasCount}{' '}
                  {billingMetrics.vencidasCount === 1
                    ? 'período finalizado'
                    : 'períodos finalizados'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Explanation / Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span>Detalhamento dos Indicadores de Faturamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Os indicadores são calculados dinamicamente a partir dos registros de vendas e
                atualizados em tempo real:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong className="text-foreground">Total Ativo:</strong> soma do montante de
                  veiculações atualmente ativas cuja data de término ainda não expirou.
                </li>
                <li>
                  <strong className="text-foreground">Cobranças Emitidas:</strong> valor bruto total
                  de todas as vendas geradas (excluindo canceladas).
                </li>
                <li>
                  <strong className="text-foreground">Cobranças Pagas:</strong> montante
                  correspondente a vendas concluídas ou em execução regular.
                </li>
                <li>
                  <strong className="text-foreground">Cobranças Vencidas:</strong> contratos cujo
                  período de veiculação terminou ou que foram encerrados.
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT PACKAGE */}
      {/* ========================================================================= */}
      <Dialog open={packageModalOpen} onOpenChange={setPackageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSavePackage}>
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? 'Editar Pacote de Publicidade' : 'Novo Pacote de Publicidade'}
              </DialogTitle>
              <DialogDescription>
                Configure as condições do pacote de mídia e sua exibição para os anunciantes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {packageFormError && (
                <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                  {packageFormError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="pkg-name" className="text-xs font-semibold">
                  Nome do Pacote <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pkg-name"
                  value={packageFormData.name}
                  onChange={(e) =>
                    setPackageFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Destaque Topo Semanal"
                  className="h-11 sm:h-9"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-mediaType" className="text-xs font-semibold">
                    Tipo de Mídia <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={packageFormData.mediaType}
                    onValueChange={(val) =>
                      setPackageFormData((prev) => ({
                        ...prev,
                        mediaType: val as PackageMediaType,
                      }))
                    }
                  >
                    <SelectTrigger id="pkg-mediaType" className="h-11 sm:h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="destaque_diretorio">Destaque no Diretório</SelectItem>
                      <SelectItem value="banner_lateral">Banner Lateral</SelectItem>
                      <SelectItem value="banner_inferior">Banner Inferior</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pkg-period" className="text-xs font-semibold">
                    Período / Formato <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={packageFormData.period}
                    onValueChange={(val) =>
                      setPackageFormData((prev) => ({ ...prev, period: val as PackagePeriod }))
                    }
                  >
                    <SelectTrigger id="pkg-period" className="h-11 sm:h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="impressoes">Impressões</SelectItem>
                      <SelectItem value="cliques">Cliques</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pkg-price" className="text-xs font-semibold">
                    Preço (R$) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pkg-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={packageFormData.price}
                    onChange={(e) =>
                      setPackageFormData((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-11 sm:h-9 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pkg-status" className="text-xs font-semibold">
                    Status
                  </Label>
                  <Select
                    value={packageFormData.status}
                    onValueChange={(val) =>
                      setPackageFormData((prev) => ({ ...prev, status: val as PackageStatus }))
                    }
                  >
                    <SelectTrigger id="pkg-status" className="h-11 sm:h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPackageModalOpen(false)}
                className="min-h-[44px] sm:min-h-[36px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPackage}
                className="min-h-[44px] sm:min-h-[36px]"
              >
                {isSubmittingPackage
                  ? 'Salvando...'
                  : editingPackage
                    ? 'Salvar Alterações'
                    : 'Criar Pacote'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: DELETE PACKAGE CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={deletePackageModalOpen} onOpenChange={setDeletePackageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Confirmar Exclusão de Pacote</span>
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o pacote <strong>{packageToDelete?.name}</strong>? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePackageModalOpen(false)}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeletePackage}
              disabled={isSubmittingPackage}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              {isSubmittingPackage ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: REGISTER SALE */}
      {/* ========================================================================= */}
      <Dialog open={saleModalOpen} onOpenChange={setSaleModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveSale}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span>Registrar Nova Venda de Publicidade</span>
              </DialogTitle>
              <DialogDescription>
                Vincule um anunciante a um pacote ativo e registre as datas e o valor cobrado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {saleFormError && (
                <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                  {saleFormError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="sale-package" className="text-xs font-semibold">
                  Pacote Selecionado <span className="text-destructive">*</span>
                </Label>
                <Select value={saleFormData.packageId} onValueChange={handlePackageSelectForSale}>
                  <SelectTrigger id="sale-package" className="h-11 sm:h-9 text-xs">
                    <SelectValue placeholder="Selecione um pacote ativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages
                      .filter((p) => p.status === 'ativo')
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {MEDIA_TYPE_LABELS[p.mediaType]} (
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(p.price)}
                          )
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sale-advName" className="text-xs font-semibold">
                    Nome do Anunciante / Empresa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sale-advName"
                    value={saleFormData.advertiserName}
                    onChange={(e) =>
                      setSaleFormData((prev) => ({ ...prev, advertiserName: e.target.value }))
                    }
                    placeholder="Ex: Construtora Alvorada"
                    className="h-11 sm:h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale-advEmail" className="text-xs font-semibold">
                    E-mail do Anunciante <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sale-advEmail"
                    type="email"
                    value={saleFormData.advertiserEmail}
                    onChange={(e) =>
                      setSaleFormData((prev) => ({ ...prev, advertiserEmail: e.target.value }))
                    }
                    placeholder="contato@anunciante.com.br"
                    className="h-11 sm:h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sale-startDate" className="text-xs font-semibold">
                    Data de Início <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sale-startDate"
                    type="date"
                    value={saleFormData.startDate}
                    onChange={(e) =>
                      setSaleFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="h-11 sm:h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale-endDate" className="text-xs font-semibold">
                    Data de Término (Opcional)
                  </Label>
                  <Input
                    id="sale-endDate"
                    type="date"
                    value={saleFormData.endDate || ''}
                    onChange={(e) =>
                      setSaleFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="h-11 sm:h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sale-amount" className="text-xs font-semibold">
                    Valor da Cobrança (R$) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sale-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={saleFormData.amount}
                    onChange={(e) =>
                      setSaleFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-11 sm:h-9 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale-status" className="text-xs font-semibold">
                    Status Inicial
                  </Label>
                  <Select
                    value={saleFormData.status}
                    onValueChange={(val) =>
                      setSaleFormData((prev) => ({ ...prev, status: val as SaleStatus }))
                    }
                  >
                    <SelectTrigger id="sale-status" className="h-11 sm:h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="encerrada">Encerrada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaleModalOpen(false)}
                className="min-h-[44px] sm:min-h-[36px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingSale}
                className="min-h-[44px] sm:min-h-[36px]"
              >
                {isSubmittingSale ? 'Registrando...' : 'Registrar Venda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
