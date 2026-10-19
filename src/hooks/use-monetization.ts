import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getAllPackages,
  getAllSales,
  createPackage,
  updatePackage,
  deletePackage,
  createSale,
  updateSale,
  computeBillingMetrics,
  type PackageItem,
  type PackageFormData,
  type SaleItem,
  type SaleFormData,
  type MonetizationBillingMetrics,
} from '@/services/monetization'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'

export interface UseMonetizationResult {
  packages: PackageItem[]
  sales: SaleItem[]
  billingMetrics: MonetizationBillingMetrics
  isLoadingPackages: boolean
  isLoadingSales: boolean
  isSubmittingPackage: boolean
  isSubmittingSale: boolean
  refetchPackages: () => Promise<void>
  refetchSales: () => Promise<void>
  handleCreatePackage: (data: PackageFormData) => Promise<boolean>
  handleUpdatePackage: (id: string, data: Partial<PackageFormData>) => Promise<boolean>
  handleDeletePackage: (id: string) => Promise<boolean>
  handleCreateSale: (data: SaleFormData) => Promise<boolean>
  handleUpdateSaleStatus: (id: string, status: SaleFormData['status']) => Promise<boolean>
}

export function useMonetization(): UseMonetizationResult {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [sales, setSales] = useState<SaleItem[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)
  const [isLoadingSales, setIsLoadingSales] = useState(true)
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false)
  const [isSubmittingSale, setIsSubmittingSale] = useState(false)

  const fetchPackages = useCallback(async () => {
    setIsLoadingPackages(true)
    try {
      const data = await getAllPackages()
      setPackages(data)
    } catch (err) {
      console.error('Erro ao carregar pacotes:', err)
      toast.error('Não foi possível carregar a lista de pacotes.')
    } finally {
      setIsLoadingPackages(false)
    }
  }, [])

  const fetchSales = useCallback(async () => {
    setIsLoadingSales(true)
    try {
      const data = await getAllSales()
      setSales(data)
    } catch (err) {
      console.error('Erro ao carregar vendas:', err)
      toast.error('Não foi possível carregar a lista de vendas.')
    } finally {
      setIsLoadingSales(false)
    }
  }, [])

  useEffect(() => {
    fetchPackages()
    fetchSales()
  }, [fetchPackages, fetchSales])

  // Realtime updates for packages
  useRealtime('packages', () => {
    fetchPackages()
  })

  // Realtime updates for sales
  useRealtime('sales', () => {
    fetchSales()
  })

  const handleCreatePackage = async (data: PackageFormData): Promise<boolean> => {
    setIsSubmittingPackage(true)
    try {
      await createPackage(data)
      toast.success('Pacote criado com sucesso!')
      await fetchPackages()
      return true
    } catch (err) {
      console.error('Erro ao criar pacote:', err)
      toast.error('Erro ao cadastrar pacote. Verifique os campos e tente novamente.')
      return false
    } finally {
      setIsSubmittingPackage(false)
    }
  }

  const handleUpdatePackage = async (
    id: string,
    data: Partial<PackageFormData>,
  ): Promise<boolean> => {
    setIsSubmittingPackage(true)
    try {
      await updatePackage(id, data)
      toast.success('Pacote atualizado com sucesso!')
      await fetchPackages()
      return true
    } catch (err) {
      console.error('Erro ao atualizar pacote:', err)
      toast.error('Erro ao atualizar o pacote.')
      return false
    } finally {
      setIsSubmittingPackage(false)
    }
  }

  const handleDeletePackage = async (id: string): Promise<boolean> => {
    setIsSubmittingPackage(true)
    try {
      await deletePackage(id)
      toast.success('Pacote excluído com sucesso!')
      await fetchPackages()
      return true
    } catch (err) {
      console.error('Erro ao excluir pacote:', err)
      toast.error('Erro ao excluir o pacote. Pode haver vendas vinculadas a ele.')
      return false
    } finally {
      setIsSubmittingPackage(false)
    }
  }

  const handleCreateSale = async (data: SaleFormData): Promise<boolean> => {
    setIsSubmittingSale(true)
    try {
      await createSale(data)
      toast.success('Venda registrada com sucesso!')
      await fetchSales()
      return true
    } catch (err) {
      console.error('Erro ao registrar venda:', err)
      toast.error('Erro ao registrar venda. Verifique os dados preenchidos.')
      return false
    } finally {
      setIsSubmittingSale(false)
    }
  }

  const handleUpdateSaleStatus = async (
    id: string,
    status: SaleFormData['status'],
  ): Promise<boolean> => {
    if (!status) return false
    setIsSubmittingSale(true)
    try {
      await updateSale(id, { status })
      toast.success('Status da venda atualizado com sucesso!')
      await fetchSales()
      return true
    } catch (err) {
      console.error('Erro ao atualizar status da venda:', err)
      toast.error('Erro ao atualizar o status da venda.')
      return false
    } finally {
      setIsSubmittingSale(false)
    }
  }

  const billingMetrics = useMemo(() => {
    return computeBillingMetrics(sales)
  }, [sales])

  return {
    packages,
    sales,
    billingMetrics,
    isLoadingPackages,
    isLoadingSales,
    isSubmittingPackage,
    isSubmittingSale,
    refetchPackages: fetchPackages,
    refetchSales: fetchSales,
    handleCreatePackage,
    handleUpdatePackage,
    handleDeletePackage,
    handleCreateSale,
    handleUpdateSaleStatus,
  }
}
