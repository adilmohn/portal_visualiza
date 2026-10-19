import pb from '@/lib/pocketbase/client'

export type PackageMediaType = 'destaque_diretorio' | 'banner_lateral' | 'banner_inferior' | 'popup'
export type PackagePeriod = 'semanal' | 'mensal' | 'impressoes' | 'cliques'
export type PackageStatus = 'ativo' | 'inativo'

export type SaleStatus = 'ativa' | 'encerrada' | 'cancelada'

export interface PackageItem {
  id: string
  name: string
  mediaType: PackageMediaType
  period: PackagePeriod
  price: number
  status: PackageStatus
  created: string
  updated: string
}

export interface PackageFormData {
  name: string
  mediaType: PackageMediaType
  period: PackagePeriod
  price: number
  status: PackageStatus
}

export interface SaleItem {
  id: string
  packageId: string
  packageName?: string
  advertiserName: string
  advertiserEmail: string
  startDate: string
  endDate?: string
  amount: number
  status: SaleStatus
  created: string
  updated: string
  expand?: {
    packageId?: PackageItem
  }
}

export interface SaleFormData {
  packageId: string
  advertiserName: string
  advertiserEmail: string
  startDate: string
  endDate?: string
  amount: number
  status?: SaleStatus
}

export interface MonetizationBillingMetrics {
  totalAtivo: number
  cobrancasEmitidas: number
  cobrancasPagas: number
  cobrancasVencidas: number
  totalAtivoCount: number
  emitidasCount: number
  pagasCount: number
  vencidasCount: number
}

export const MEDIA_TYPE_LABELS: Record<PackageMediaType, string> = {
  destaque_diretorio: 'Destaque no Diretório',
  banner_lateral: 'Banner Lateral',
  banner_inferior: 'Banner Inferior',
  popup: 'Popup',
}

export const PERIOD_LABELS: Record<PackagePeriod, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  impressoes: 'Impressões',
  cliques: 'Cliques',
}

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
}

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  ativa: 'Ativa',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
}

/**
 * Maps PocketBase package record to PackageItem
 */
function mapRecordToPackage(rec: Record<string, unknown>): PackageItem {
  return {
    id: (rec.id as string) || '',
    name: (rec.name as string) || '',
    mediaType: (rec.mediaType as PackageMediaType) || 'destaque_diretorio',
    period: (rec.period as PackagePeriod) || 'mensal',
    price: typeof rec.price === 'number' ? rec.price : Number(rec.price) || 0,
    status: (rec.status as PackageStatus) || 'ativo',
    created: (rec.created as string) || '',
    updated: (rec.updated as string) || '',
  }
}

/**
 * Maps PocketBase sale record to SaleItem
 */
function mapRecordToSale(rec: Record<string, unknown>): SaleItem {
  const expand = rec.expand as { packageId?: Record<string, unknown> } | undefined
  const expandedPackage = expand?.packageId ? mapRecordToPackage(expand.packageId) : undefined

  return {
    id: (rec.id as string) || '',
    packageId: (rec.packageId as string) || '',
    packageName: expandedPackage?.name,
    advertiserName: (rec.advertiserName as string) || '',
    advertiserEmail: (rec.advertiserEmail as string) || '',
    startDate: (rec.startDate as string) || '',
    endDate: (rec.endDate as string) || undefined,
    amount: typeof rec.amount === 'number' ? rec.amount : Number(rec.amount) || 0,
    status: (rec.status as SaleStatus) || 'ativa',
    created: (rec.created as string) || '',
    updated: (rec.updated as string) || '',
    expand: expandedPackage ? { packageId: expandedPackage } : undefined,
  }
}

/**
 * Public: Get all active packages for public pricing page (/planos)
 */
export async function getActivePackages(): Promise<PackageItem[]> {
  const records = await pb.collection('packages').getFullList({
    filter: 'status = "ativo"',
    sort: 'price',
  })
  return records.map((r) => mapRecordToPackage(r as unknown as Record<string, unknown>))
}

/**
 * Admin: Get all packages (both active and inactive)
 */
export async function getAllPackages(): Promise<PackageItem[]> {
  const records = await pb.collection('packages').getFullList({
    sort: '-created',
  })
  return records.map((r) => mapRecordToPackage(r as unknown as Record<string, unknown>))
}

/**
 * Admin: Create a new package
 */
export async function createPackage(data: PackageFormData): Promise<PackageItem> {
  const record = await pb.collection('packages').create({
    name: data.name.trim(),
    mediaType: data.mediaType,
    period: data.period,
    price: Number(data.price),
    status: data.status || 'ativo',
  })
  return mapRecordToPackage(record as unknown as Record<string, unknown>)
}

/**
 * Admin: Update an existing package
 */
export async function updatePackage(
  id: string,
  data: Partial<PackageFormData>,
): Promise<PackageItem> {
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name.trim()
  if (data.mediaType !== undefined) payload.mediaType = data.mediaType
  if (data.period !== undefined) payload.period = data.period
  if (data.price !== undefined) payload.price = Number(data.price)
  if (data.status !== undefined) payload.status = data.status

  const record = await pb.collection('packages').update(id, payload)
  return mapRecordToPackage(record as unknown as Record<string, unknown>)
}

/**
 * Admin: Delete a package
 */
export async function deletePackage(id: string): Promise<void> {
  await pb.collection('packages').delete(id)
}

/**
 * Admin: Get all sales registered, with expanded package
 */
export async function getAllSales(): Promise<SaleItem[]> {
  const records = await pb.collection('sales').getFullList({
    sort: '-created',
    expand: 'packageId',
  })
  return records.map((r) => mapRecordToSale(r as unknown as Record<string, unknown>))
}

/**
 * Register a sale (public creation or admin)
 */
export async function createSale(data: SaleFormData): Promise<SaleItem> {
  const payload: Record<string, unknown> = {
    packageId: data.packageId,
    advertiserName: data.advertiserName.trim(),
    advertiserEmail: data.advertiserEmail.trim(),
    startDate: data.startDate,
    amount: Number(data.amount),
    status: data.status || 'ativa',
  }
  if (data.endDate && data.endDate.trim()) {
    payload.endDate = data.endDate
  }

  const record = await pb.collection('sales').create(payload, {
    expand: 'packageId',
  })
  return mapRecordToSale(record as unknown as Record<string, unknown>)
}

/**
 * Admin: Update a sale (e.g. status)
 */
export async function updateSale(id: string, data: Partial<SaleFormData>): Promise<SaleItem> {
  const payload: Record<string, unknown> = {}
  if (data.packageId !== undefined) payload.packageId = data.packageId
  if (data.advertiserName !== undefined) payload.advertiserName = data.advertiserName.trim()
  if (data.advertiserEmail !== undefined) payload.advertiserEmail = data.advertiserEmail.trim()
  if (data.startDate !== undefined) payload.startDate = data.startDate
  if (data.endDate !== undefined) payload.endDate = data.endDate || null
  if (data.amount !== undefined) payload.amount = Number(data.amount)
  if (data.status !== undefined) payload.status = data.status

  const record = await pb.collection('sales').update(id, payload, {
    expand: 'packageId',
  })
  return mapRecordToSale(record as unknown as Record<string, unknown>)
}

/**
 * Computes billing metrics from a list of sales:
 * - total ativo: sum of amounts for sales with status 'ativa' that are not expired
 * - cobranças emitidas: all sales generated (except cancelada)
 * - pagas: completed / active sales
 * - vencidas: sales with endDate < today or status 'encerrada'
 */
export function computeBillingMetrics(sales: SaleItem[]): MonetizationBillingMetrics {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let totalAtivo = 0
  let cobrancasEmitidas = 0
  let cobrancasPagas = 0
  let cobrancasVencidas = 0

  let totalAtivoCount = 0
  let emitidasCount = 0
  let pagasCount = 0
  let vencidasCount = 0

  for (const sale of sales) {
    const amount = Number(sale.amount) || 0
    const isCancelled = sale.status === 'cancelada'
    const isAtiva = sale.status === 'ativa'
    const isEncerrada = sale.status === 'encerrada'

    const hasEndDate = Boolean(sale.endDate)
    const isPastEnd = hasEndDate && new Date(sale.endDate!) < today

    // Cobranças emitidas: todas as vendas registradas não canceladas
    if (!isCancelled) {
      cobrancasEmitidas += amount
      emitidasCount += 1
    }

    // Total Ativo: status ativa e não expirada
    if (isAtiva && !isPastEnd) {
      totalAtivo += amount
      totalAtivoCount += 1
    }

    // Cobranças Pagas: vendas ativas ou encerradas regularmente
    if (isAtiva || isEncerrada) {
      cobrancasPagas += amount
      pagasCount += 1
    }

    // Cobranças Vencidas: expiradas pela data de término ou encerradas
    if ((isAtiva && isPastEnd) || isEncerrada) {
      cobrancasVencidas += amount
      vencidasCount += 1
    }
  }

  return {
    totalAtivo,
    cobrancasEmitidas,
    cobrancasPagas,
    cobrancasVencidas,
    totalAtivoCount,
    emitidasCount,
    pagasCount,
    vencidasCount,
  }
}
