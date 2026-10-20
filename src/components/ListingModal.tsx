import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  X,
  Star,
  Check,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'
import type { UserListingOption } from '@/hooks/use-vouchers'
import type { ListingTypeOption } from '@/pages/Cadastro'

interface ViaCepResponse {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean | string
}

interface ListingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingToEdit?: UserListingOption | null
  userId: string
  onSaved: () => void
}

interface ExistingPhoto {
  id: string
  url: string
  isMain: boolean
}

export function ListingModal({
  open,
  onOpenChange,
  listingToEdit,
  userId,
  onSaved,
}: ListingModalProps) {
  const isEditing = Boolean(listingToEdit)

  // Form Fields
  const [type, setType] = useState<ListingTypeOption | ''>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('')

  // CEP & Address
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [isAddressManual, setIsAddressManual] = useState(false)
  const [cepErrorMsg, setCepErrorMsg] = useState<string | null>(null)

  // Map Pin
  const [pinEnabled, setPinEnabled] = useState(false)

  // Photos State: existing photos from backend
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([])
  const [mainPhotoId, setMainPhotoId] = useState<string | null>(null)

  // New photo upload
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)
  const [newPhotoError, setNewPhotoError] = useState<string | null>(null)
  const [newPhotoAsMain, setNewPhotoAsMain] = useState(false)

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate form when opening in create or edit mode
  useEffect(() => {
    if (open) {
      if (listingToEdit) {
        setType((listingToEdit.type as ListingTypeOption) || 'empresa')
        setName(listingToEdit.name || '')
        setDescription(listingToEdit.description || '')
        setEmail(listingToEdit.email || '')
        setPhone(listingToEdit.phone || '')
        setWhatsapp(listingToEdit.whatsapp || '')
        setWebsite(listingToEdit.website || '')
        setCep(listingToEdit.cep || '')
        setAddress(listingToEdit.address || '')
        setCity(listingToEdit.city || '')
        setState(listingToEdit.state || '')
        setNeighborhood(listingToEdit.neighborhood || '')
        setPinEnabled(Boolean(listingToEdit.pinEnabled))
        setIsAddressManual(false)
        setCepErrorMsg(null)

        const photos = (listingToEdit.photos || []).map((p, idx) => ({
          id: p.id,
          url: p.url,
          isMain: Boolean(p.isMain) || idx === 0,
        }))
        setExistingPhotos(photos)
        const main = photos.find((p) => p.isMain) || photos[0]
        setMainPhotoId(main ? main.id : null)
        setNewPhotoAsMain(photos.length === 0)
      } else {
        // Create mode
        setType('servico')
        setName('')
        setDescription('')
        setEmail(pb.authStore.record?.email || '')
        setPhone('')
        setWhatsapp('')
        setWebsite('')
        setCep('')
        setAddress('')
        setCity('')
        setState('')
        setNeighborhood('')
        setPinEnabled(false)
        setIsAddressManual(false)
        setCepErrorMsg(null)
        setExistingPhotos([])
        setMainPhotoId(null)
        setNewPhotoAsMain(true)
      }

      setNewPhotoFile(null)
      if (newPhotoPreview) {
        URL.revokeObjectURL(newPhotoPreview)
      }
      setNewPhotoPreview(null)
      setNewPhotoError(null)
      setTouched({})
      setErrors({})
    }
  }, [open, listingToEdit])

  // ViaCEP handler
  const handleCepChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 8)
    setCep(rawVal)
    setCepErrorMsg(null)

    if (rawVal.length === 8) {
      setIsCepLoading(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawVal}/json/`)
        if (!response.ok) throw new Error('Falha no serviço de CEP')
        const data: ViaCepResponse = await response.json()
        if (data.erro) throw new Error('CEP não encontrado')

        setAddress(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setState(data.uf || '')
        setIsAddressManual(false)
        setCepErrorMsg(null)
      } catch {
        setCepErrorMsg('Não foi possível consultar o CEP, preencha manualmente')
        setIsAddressManual(true)
      } finally {
        setIsCepLoading(false)
      }
    }
  }

  // Photo change handler
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewPhotoError(null)
    const file = e.target.files?.[0]
    if (!file) {
      setNewPhotoFile(null)
      setNewPhotoPreview(null)
      return
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      setNewPhotoError('Formato de imagem inválido. Aceito apenas JPG ou PNG.')
      setNewPhotoFile(null)
      setNewPhotoPreview(null)
      return
    }

    const maxBytes = 5 * 1024 * 1024 // 5MB
    if (file.size > maxBytes) {
      setNewPhotoError('A imagem excede o tamanho máximo permitido de 5MB.')
      setNewPhotoFile(null)
      setNewPhotoPreview(null)
      return
    }

    setNewPhotoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setNewPhotoPreview(previewUrl)
  }

  const removeNewPhoto = () => {
    setNewPhotoFile(null)
    if (newPhotoPreview) {
      URL.revokeObjectURL(newPhotoPreview)
      setNewPhotoPreview(null)
    }
    setNewPhotoError(null)
    if (existingPhotos.length > 0 && !mainPhotoId) {
      setMainPhotoId(existingPhotos[0].id)
    }
  }

  const handleSetMainExistingPhoto = (photoId: string) => {
    setMainPhotoId(photoId)
    setNewPhotoAsMain(false)
  }

  const handleSetNewPhotoAsMain = () => {
    setNewPhotoAsMain(true)
    setMainPhotoId(null)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!type) errs.type = 'Selecione o tipo do anúncio.'
    if (!name.trim()) errs.name = 'O nome é obrigatório.'
    if (!description.trim()) errs.description = 'A descrição é obrigatória.'
    else if (description.length > 1000)
      errs.description = 'A descrição deve ter no máximo 1000 caracteres.'
    if (!email.trim()) errs.email = 'O e-mail de contato é obrigatório.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Informe um e-mail válido.'

    const cleanCep = cep.replace(/\D/g, '')
    if (!cleanCep || cleanCep.length !== 8) errs.cep = 'Informe um CEP válido com 8 dígitos.'
    if (!address.trim()) errs.address = 'O endereço/logradouro é obrigatório.'
    if (!city.trim()) errs.city = 'A cidade é obrigatória.'
    if (!state.trim()) errs.state = 'O estado (UF) é obrigatório.'
    if (newPhotoError) errs.photo = newPhotoError

    return errs
  }

  const currentErrors = validate()
  const isValid = Object.keys(currentErrors).length === 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched({
      type: true,
      name: true,
      description: true,
      email: true,
      cep: true,
      address: true,
      city: true,
      state: true,
    })

    const errs = validate()
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      toast({
        title: 'Verifique o formulário',
        description: 'Por favor, preencha todos os campos obrigatórios corretamente.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Prepare listing payload
      // Status goes to 'pendente' on edit or create for moderation
      const listingPayload = {
        userId: userId || pb.authStore.record?.id,
        name: name.trim(),
        type: type as ListingTypeOption,
        description: description.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        website: website.trim() || undefined,
        cep: cep.replace(/\D/g, ''),
        address: address.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        country: 'Brasil',
        neighborhood: neighborhood.trim() || undefined,
        status: 'pendente',
        pinEnabled: Boolean(pinEnabled),
      }

      let listingId: string

      if (isEditing && listingToEdit) {
        listingId = listingToEdit.id
        await pb.collection('listings').update(listingId, listingPayload)
      } else {
        const created = await pb.collection('listings').create(listingPayload)
        listingId = created.id
      }

      // 2. Upload new photo if provided
      let newlyUploadedPhotoId: string | null = null
      if (newPhotoFile && listingId) {
        try {
          const photoFormData = new FormData()
          photoFormData.append('listingId', listingId)
          photoFormData.append('url', newPhotoFile)
          // If new photo is marked as main or no existing photos
          const shouldBeMain = newPhotoAsMain || existingPhotos.length === 0
          photoFormData.append('isMain', shouldBeMain ? 'true' : 'false')

          const createdPhoto = await pb.collection('photos').create(photoFormData)
          newlyUploadedPhotoId = createdPhoto.id
        } catch (photoErr) {
          console.warn('Erro ao enviar foto:', photoErr)
          toast({
            title: 'Aviso sobre a foto',
            description: 'O anúncio foi salvo, mas não foi possível enviar a nova imagem.',
            variant: 'destructive',
          })
        }
      }

      // 3. Update main photo designation among existing photos
      if (existingPhotos.length > 0) {
        // If newly uploaded photo is main, set all existing isMain to false
        const targetMainId = newPhotoAsMain && newlyUploadedPhotoId ? null : mainPhotoId

        for (const ep of existingPhotos) {
          const isThisMain = targetMainId === ep.id
          if (ep.isMain !== isThisMain) {
            try {
              await pb.collection('photos').update(ep.id, {
                isMain: isThisMain,
              })
            } catch (updateErr) {
              console.warn('Aviso ao atualizar foto principal:', updateErr)
            }
          }
        }
      }

      toast({
        title: isEditing ? 'Anúncio atualizado!' : 'Anúncio cadastrado!',
        description: isEditing
          ? 'As alterações foram salvas e enviadas para revisão da moderação.'
          : 'Seu novo anúncio foi criado com sucesso e aguarda moderação.',
      })

      onOpenChange(false)
      onSaved()
    } catch (err: unknown) {
      console.error('Erro ao salvar anúncio:', err)
      const errorMsg =
        (err as { message?: string })?.message ||
        'Não foi possível salvar o anúncio. Tente novamente mais tarde.'
      toast({
        title: 'Erro ao salvar anúncio',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const showTypeErr = touched.type && Boolean(errors.type || currentErrors.type)
  const showNameErr = touched.name && Boolean(errors.name || currentErrors.name)
  const showDescErr =
    touched.description && Boolean(errors.description || currentErrors.description)
  const showEmailErr = touched.email && Boolean(errors.email || currentErrors.email)
  const showCepErr = touched.cep && Boolean(errors.cep || currentErrors.cep)
  const showAddressErr = touched.address && Boolean(errors.address || currentErrors.address)
  const showCityErr = touched.city && Boolean(errors.city || currentErrors.city)
  const showStateErr = touched.state && Boolean(errors.state || currentErrors.state)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl">
              {isEditing ? `Editar Anúncio: ${listingToEdit?.name}` : 'Cadastrar Novo Anúncio'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações do anúncio e altere a foto principal. Ao salvar, o anúncio retornará ao status pendente para moderação.'
              : 'Cadastre um novo serviço, produto ou empresa com sua conta atual. Você pode cadastrar múltiplos anúncios.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-6 py-2">
          {/* Tipo e Nome */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="modal-listing-type" className="text-sm font-medium">
                Tipo de Cadastro <span className="text-destructive">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(val: ListingTypeOption) => {
                  setType(val)
                  setTouched((prev) => ({ ...prev, type: true }))
                  setErrors((prev) => ({ ...prev, type: '' }))
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="modal-listing-type"
                  className={`min-h-[44px] ${showTypeErr ? 'border-destructive ring-destructive' : ''}`}
                >
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servico" className="min-h-[44px]">
                    Serviço
                  </SelectItem>
                  <SelectItem value="produto" className="min-h-[44px]">
                    Produto
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
                </SelectContent>
              </Select>
              {showTypeErr && (
                <p className="text-xs text-destructive">{errors.type || currentErrors.type}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-listing-name" className="text-sm font-medium">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-listing-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors((prev) => ({ ...prev, name: '' }))
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                placeholder="Nome da empresa, serviço ou produto"
                className={`min-h-[44px] ${showNameErr ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {showNameErr && (
                <p className="text-xs text-destructive">{errors.name || currentErrors.name}</p>
              )}
            </div>
          </div>

          {/* Descrição com contador */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-listing-description" className="text-sm font-medium">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-xs font-mono ${
                  description.length > 1000
                    ? 'text-destructive font-bold'
                    : description.length >= 900
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                }`}
              >
                {description.length} / 1000 caracteres
              </span>
            </div>
            <Textarea
              id="modal-listing-description"
              rows={3}
              value={description}
              maxLength={1000}
              onChange={(e) => {
                setDescription(e.target.value)
                setErrors((prev) => ({ ...prev, description: '' }))
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
              placeholder="Descreva atividades, público-alvo e diferenciais competitivos..."
              className={`resize-y ${showDescErr ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
            />
            {showDescErr && (
              <p className="text-xs text-destructive">
                {errors.description || currentErrors.description}
              </p>
            )}
          </div>

          {/* Contatos */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="modal-listing-email" className="text-sm font-medium">
                E-mail de Contato <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="modal-listing-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  placeholder="contato@empresa.com.br"
                  className={`pl-9 min-h-[44px] ${showEmailErr ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {showEmailErr && (
                <p className="text-xs text-destructive">{errors.email || currentErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-listing-phone" className="text-sm font-medium">
                Telefone (opcional)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="modal-listing-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 3456-7890"
                  className="pl-9 min-h-[44px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-listing-whatsapp" className="text-sm font-medium">
                WhatsApp (opcional)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="modal-listing-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="pl-9 min-h-[44px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-listing-website" className="text-sm font-medium">
                Website (opcional)
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="modal-listing-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.empresa.com.br"
                  className="pl-9 min-h-[44px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Endereço & ViaCEP */}
          <div className="space-y-4 pt-2 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" /> Endereço e Localização
                </h3>
                <p className="text-xs text-muted-foreground">
                  Preencha o CEP para consulta automática via ViaCEP.
                </p>
              </div>

              {isAddressManual && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary self-start sm:self-auto h-8"
                  onClick={() => {
                    setIsAddressManual(false)
                    setCepErrorMsg(null)
                  }}
                >
                  Tentar busca automática
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3 items-start">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="modal-listing-cep" className="text-sm font-medium">
                  CEP (8 dígitos) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="modal-listing-cep"
                    type="text"
                    maxLength={8}
                    value={cep}
                    onChange={handleCepChange}
                    onBlur={() => setTouched((prev) => ({ ...prev, cep: true }))}
                    placeholder="01310100"
                    className={`pl-9 min-h-[44px] ${showCepErr ? 'border-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  {isCepLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
                {showCepErr && (
                  <p className="text-xs text-destructive">{errors.cep || currentErrors.cep}</p>
                )}
              </div>

              <div className="sm:col-span-2 pt-1 sm:pt-6">
                {cepErrorMsg ? (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{cepErrorMsg}</span>
                  </div>
                ) : address ? (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Endereço localizado com sucesso!
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="modal-listing-address" className="text-sm font-medium">
                  Endereço / Logradouro <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-listing-address"
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setErrors((prev) => ({ ...prev, address: '' }))
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
                  placeholder="Rua, Avenida, Praça..."
                  readOnly={!isAddressManual && Boolean(address)}
                  className={`min-h-[44px] ${!isAddressManual && address ? 'bg-muted/50 cursor-default' : ''} ${showAddressErr ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
                {showAddressErr && (
                  <p className="text-xs text-destructive">
                    {errors.address || currentErrors.address}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-listing-neighborhood" className="text-sm font-medium">
                  Bairro (opcional)
                </Label>
                <Input
                  id="modal-listing-neighborhood"
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  readOnly={!isAddressManual && Boolean(neighborhood)}
                  className={`min-h-[44px] ${!isAddressManual && neighborhood ? 'bg-muted/50 cursor-default' : ''}`}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-listing-city" className="text-sm font-medium">
                  Cidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-listing-city"
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    setErrors((prev) => ({ ...prev, city: '' }))
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, city: true }))}
                  placeholder="Cidade"
                  readOnly={!isAddressManual && Boolean(city)}
                  className={`min-h-[44px] ${!isAddressManual && city ? 'bg-muted/50 cursor-default' : ''} ${showCityErr ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
                {showCityErr && (
                  <p className="text-xs text-destructive">{errors.city || currentErrors.city}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-listing-state" className="text-sm font-medium">
                  Estado (UF) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-listing-state"
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value.toUpperCase())
                    setErrors((prev) => ({ ...prev, state: '' }))
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, state: true }))}
                  placeholder="SP"
                  readOnly={!isAddressManual && Boolean(state)}
                  className={`min-h-[44px] uppercase ${!isAddressManual && state ? 'bg-muted/50 cursor-default' : ''} ${showStateErr ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
                {showStateErr && (
                  <p className="text-xs text-destructive">{errors.state || currentErrors.state}</p>
                )}
              </div>
            </div>
          </div>

          {/* FOTOS E FOTO PRINCIPAL */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div>
              <Label className="text-sm font-medium">Fotos e Foto Principal (Capa)</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                A foto marcada como principal será exibida nos cards do diretório e como destaque no
                detalhe. Formatos: JPG ou PNG (máx. 5MB).
              </p>
            </div>

            {/* Existing Photos List (with Principal selection) */}
            {existingPhotos.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fotos Atuais ({existingPhotos.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {existingPhotos.map((photo) => {
                    const isMain = mainPhotoId === photo.id && !newPhotoAsMain
                    return (
                      <div
                        key={photo.id}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all p-1.5 bg-muted/20 ${
                          isMain
                            ? 'border-primary ring-2 ring-primary/30 shadow-sm'
                            : 'border-border/80 hover:border-border'
                        }`}
                      >
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/5 relative">
                          <img
                            src={photo.url}
                            alt="Foto do anúncio"
                            className="w-full h-full object-cover"
                          />
                          {isMain && (
                            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow">
                              <Star className="h-3 w-3 fill-current" /> Principal
                            </span>
                          )}
                        </div>

                        <div className="pt-2 flex justify-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={isMain ? 'default' : 'outline'}
                            onClick={() => handleSetMainExistingPhoto(photo.id)}
                            className="w-full h-8 text-xs min-h-[32px] gap-1"
                            disabled={isSubmitting}
                          >
                            {isMain ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Foto Principal</span>
                              </>
                            ) : (
                              <>
                                <Star className="h-3.5 w-3.5" />
                                <span>Definir como Principal</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Incluir Nova Foto */}
            <div className="space-y-2 pt-1">
              <Label
                htmlFor="modal-listing-photo"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {existingPhotos.length > 0 ? 'Incluir Nova Foto' : 'Foto ou Logotipo'}
              </Label>

              {newPhotoPreview ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border p-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <img
                      src={newPhotoPreview}
                      alt="Pré-visualização"
                      className="h-16 w-16 rounded-lg object-cover border border-border"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {newPhotoFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {newPhotoFile ? `${(newPhotoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant={newPhotoAsMain ? 'default' : 'outline'}
                      onClick={handleSetNewPhotoAsMain}
                      className="min-h-[36px] text-xs gap-1"
                      disabled={isSubmitting}
                    >
                      {newPhotoAsMain ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Principal
                        </>
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5" /> Marcar como Principal
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeNewPhoto}
                      className="min-h-[36px] text-xs text-destructive hover:bg-destructive/10"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="modal-listing-photo"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoChange}
                    disabled={isSubmitting}
                    className="min-h-[44px] cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Upload className="h-4 w-4" />
                  </div>
                </div>
              )}

              {newPhotoError && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {newPhotoError}
                </p>
              )}
            </div>
          </div>

          {/* Alfinete no Mapa */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 p-3 bg-muted/20">
            <div className="space-y-0.5 pr-4">
              <Label
                htmlFor="modal-listing-pin"
                className="text-sm font-medium cursor-pointer text-foreground flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span>Exibir alfinete no mapa do diretório</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Habilita o alfinete interativo na visualização do diretório geográfico.
              </p>
            </div>
            <Switch
              id="modal-listing-pin"
              checked={pinEnabled}
              onCheckedChange={setPinEnabled}
              disabled={isSubmitting}
              className="min-w-[44px] min-h-[24px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/60">
            <div className="text-xs text-muted-foreground flex items-center gap-1 mr-auto order-2 sm:order-1">
              <FileText className="h-3.5 w-3.5" />
              <span>* Campos obrigatórios</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="min-h-[44px] font-semibold gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Anúncio'}</span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
