import { useState, type FormEvent, type ChangeEvent, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  ArrowRight,
  Building2,
  MapPin,
  Phone,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

export type ListingTypeOption = 'empresa' | 'negocio' | 'solucao' | 'produto'

interface ViaCepResponse {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  ibge?: string
  gia?: string
  ddd?: string
  siafi?: string
  erro?: boolean | string
}

export default function Cadastro() {
  const { signUp, user, isAuthenticated } = useAuth()

  // Step state: 1 = Conta de Usuário, 2 = Anúncio / Listagem, 3 = Sucesso
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    // If the user is already authenticated when visiting /cadastro, start directly on step 2
    return isAuthenticated ? 2 : 1
  })

  // Synchronize if user logs in / auth completes while on step 1
  useEffect(() => {
    if (isAuthenticated && currentStep === 1) {
      setCurrentStep(2)
    }
  }, [isAuthenticated, currentStep])

  // --- Step 1 States ---
  const [step1Name, setStep1Name] = useState('')
  const [step1Email, setStep1Email] = useState('')
  const [step1Password, setStep1Password] = useState('')
  const [step1PasswordConfirm, setStep1PasswordConfirm] = useState('')
  const [step1Submitting, setStep1Submitting] = useState(false)
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})

  // --- Step 2 States ---
  const [type, setType] = useState<ListingTypeOption | ''>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('')

  // CEP & Address fields
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [isAddressManual, setIsAddressManual] = useState(false)
  const [cepErrorMsg, setCepErrorMsg] = useState<string | null>(null)

  // Map pin
  const [pinEnabled, setPinEnabled] = useState(false)

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Checkboxes
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  // Validation & Submission
  const [step2Submitting, setStep2Submitting] = useState(false)
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({})
  const [step2Touched, setStep2Touched] = useState<Record<string, boolean>>({})

  // Prefill email in step 2 whenever available from auth or step 1
  useEffect(() => {
    const defaultEmail = user?.email || step1Email
    if (defaultEmail && !email) {
      setEmail(defaultEmail)
    }
  }, [user?.email, step1Email, email])

  // ================= STEP 1 HANDLERS =================
  const validateStep1 = () => {
    const errors: Record<string, string> = {}
    if (!step1Name.trim()) {
      errors.name = 'O nome é obrigatório.'
    }
    if (!step1Email.trim()) {
      errors.email = 'O e-mail é obrigatório.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1Email.trim())) {
      errors.email = 'Informe um e-mail válido.'
    }
    if (!step1Password) {
      errors.password = 'A senha é obrigatória.'
    } else if (step1Password.length < 8) {
      errors.password = 'A senha deve possuir no mínimo 8 caracteres.'
    }
    if (!step1PasswordConfirm) {
      errors.passwordConfirm = 'Confirme sua senha.'
    } else if (step1Password !== step1PasswordConfirm) {
      errors.passwordConfirm = 'As senhas não coincidem.'
    }
    setStep1Errors(errors)
    return Object.keys(errors).length === 0
  }

  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateStep1()) {
      return
    }

    setStep1Submitting(true)
    try {
      const result = await signUp({
        name: step1Name.trim(),
        email: step1Email.trim(),
        password: step1Password,
        passwordConfirm: step1PasswordConfirm,
      })

      if (result.success) {
        setEmail(step1Email.trim())
        setCurrentStep(2)
        toast.success('Conta criada com sucesso! Prossiga com o cadastro do seu anúncio.')
      } else {
        const errorMsg = result.error || 'Falha ao criar conta. Verifique os dados informados.'
        setStep1Errors((prev) => ({ ...prev, form: errorMsg }))
        toast.error(errorMsg)
      }
    } catch {
      const errorMsg = 'Ocorreu um erro inesperado ao realizar o cadastro. Tente novamente.'
      setStep1Errors((prev) => ({ ...prev, form: errorMsg }))
      toast.error(errorMsg)
    } finally {
      setStep1Submitting(false)
    }
  }

  // ================= STEP 2 HANDLERS =================
  const handleCepChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 8)
    setCep(rawVal)
    setCepErrorMsg(null)

    if (rawVal.length === 8) {
      setIsCepLoading(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawVal}/json/`)
        if (!response.ok) {
          throw new Error('Falha na resposta do serviço de CEP')
        }
        const data: ViaCepResponse = await response.json()
        if (data.erro) {
          throw new Error('CEP não encontrado')
        }

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
    } else {
      // If user edits or clears CEP after it was complete, allow manual input if needed
      if (rawVal.length < 8 && !isAddressManual && (address || city || state)) {
        // keep values or allow editing
      }
    }
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null)
    const file = e.target.files?.[0]
    if (!file) {
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      setPhotoError('Formato de imagem inválido. Aceito apenas JPG ou PNG.')
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    const maxBytes = 5 * 1024 * 1024 // 5MB
    if (file.size > maxBytes) {
      setPhotoError('A imagem excede o tamanho máximo permitido de 5MB.')
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    setPhotoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
  }

  const removePhoto = () => {
    setPhotoFile(null)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
      setPhotoPreview(null)
    }
    setPhotoError(null)
  }

  const markTouched = (fieldName: string) => {
    setStep2Touched((prev) => ({ ...prev, [fieldName]: true }))
  }

  // Client-side validation of Step 2
  const validateStep2 = () => {
    const errors: Record<string, string> = {}

    if (!type) {
      errors.type = 'Selecione o tipo de cadastro.'
    }

    if (!name.trim()) {
      errors.name = 'O nome do anúncio é obrigatório.'
    }

    if (!description.trim()) {
      errors.description = 'A descrição é obrigatória.'
    } else if (description.length > 1000) {
      errors.description = 'A descrição deve ter no máximo 1000 caracteres.'
    }

    if (!email.trim()) {
      errors.email = 'O e-mail de contato é obrigatório.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Informe um e-mail válido.'
    }

    const cleanCep = cep.replace(/\D/g, '')
    if (!cleanCep || cleanCep.length !== 8) {
      errors.cep = 'Informe um CEP válido com 8 dígitos.'
    }

    if (!address.trim()) {
      errors.address = 'O endereço/logradouro é obrigatório.'
    }

    if (!city.trim()) {
      errors.city = 'A cidade é obrigatória.'
    }

    if (!state.trim()) {
      errors.state = 'O estado (UF) é obrigatório.'
    }

    if (!termsAccepted) {
      errors.terms = 'É necessário aceitar os Termos de Uso.'
    }

    if (!privacyAccepted) {
      errors.privacy = 'É necessário aceitar a Política de Privacidade.'
    }

    if (photoError) {
      errors.photo = photoError
    }

    return errors
  }

  const currentStep2Errors = validateStep2()
  const isStep2Valid = Object.keys(currentStep2Errors).length === 0

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault()
    setStep2Touched({
      type: true,
      name: true,
      description: true,
      email: true,
      cep: true,
      address: true,
      city: true,
      state: true,
      terms: true,
      privacy: true,
    })

    const errors = validateStep2()
    setStep2Errors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error('Por favor, preencha todos os campos obrigatórios corretamente.')
      return
    }

    const currentUserId = user?.id || pb.authStore.record?.id
    if (!currentUserId) {
      toast.error('Sessão expirada. Por favor, faça login novamente para prosseguir.')
      return
    }

    setStep2Submitting(true)

    try {
      // 1. Create the listing record with status = 'pendente'
      const listingPayload = {
        userId: currentUserId,
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

      const createdListing = await pb.collection('listings').create(listingPayload)

      // 2. Upload optional photo if selected
      if (photoFile && createdListing.id) {
        try {
          const photoFormData = new FormData()
          photoFormData.append('listingId', createdListing.id)
          photoFormData.append('url', photoFile)

          await pb.collection('photos').create(photoFormData)
        } catch (photoErr) {
          console.warn('Aviso ao carregar foto do anúncio:', photoErr)
          // Photo upload failure is warned, listing is already saved as pendente
          toast.warning('Anúncio criado com sucesso, mas houve uma falha ao enviar a foto de capa.')
        }
      }

      toast.success('Cadastro enviado com sucesso!')
      setCurrentStep(3)
    } catch (err: unknown) {
      console.error('Erro ao submeter listagem:', err)
      const errorMsg =
        (err as { message?: string })?.message ||
        'Não foi possível salvar os dados do anúncio. Verifique os campos e tente novamente.'
      toast.error(errorMsg)
    } finally {
      setStep2Submitting(false)
    }
  }

  // ================= STEP 3 (SUCCESS SCREEN) =================
  if (currentStep === 3) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-lg shadow-xl border-border/80 text-center animate-fade-in">
          <CardHeader className="space-y-4 pb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-500/10 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Cadastro enviado! Confirme seu e-mail e aguarde a aprovação.
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed">
              Obrigado por registrar seu anúncio no Portal Viabilize. Nossa equipe revisará as
              informações e você receberá uma notificação assim que o anúncio for aprovado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-xl bg-muted/60 p-4 text-left border border-border/60 space-y-1.5">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> Verificação de e-mail
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Um link de confirmação foi encaminhado para seu e-mail cadastrado. Lembre-se de
                verificar sua caixa de entrada e spam.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Button asChild className="w-full sm:w-auto font-semibold">
              <Link to="/area">Ir para Minha Área</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/diretorio">Explorar Diretório</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ================= STEP 1 SCREEN =================
  if (currentStep === 1) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-md shadow-lg border-border/80 animate-fade-in">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
              <UserPlus className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              Etapa 1 de 2
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Criar Conta de Usuário
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Primeiro, crie seu acesso no Portal Viabilize para gerenciar seu anúncio.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleStep1Submit} noValidate>
            <CardContent className="space-y-4">
              {step1Errors.form && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{step1Errors.form}</span>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="step1-name" className="text-sm font-medium">
                  Nome completo <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="step1-name"
                    type="text"
                    value={step1Name}
                    onChange={(e) => {
                      setStep1Name(e.target.value)
                      if (step1Errors.name) {
                        setStep1Errors((prev) => ({ ...prev, name: '' }))
                      }
                    }}
                    placeholder="Seu nome ou razão social"
                    autoComplete="name"
                    className={`pl-9 min-h-[44px] ${step1Errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={step1Submitting}
                    aria-invalid={Boolean(step1Errors.name)}
                    aria-describedby={step1Errors.name ? 'step1-name-error' : undefined}
                  />
                </div>
                {step1Errors.name && (
                  <p id="step1-name-error" className="text-xs text-destructive">
                    {step1Errors.name}
                  </p>
                )}
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="step1-email" className="text-sm font-medium">
                  E-mail <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="step1-email"
                    type="email"
                    value={step1Email}
                    onChange={(e) => {
                      setStep1Email(e.target.value)
                      if (step1Errors.email) {
                        setStep1Errors((prev) => ({ ...prev, email: '' }))
                      }
                    }}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className={`pl-9 min-h-[44px] ${step1Errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={step1Submitting}
                    aria-invalid={Boolean(step1Errors.email)}
                    aria-describedby={step1Errors.email ? 'step1-email-error' : undefined}
                  />
                </div>
                {step1Errors.email && (
                  <p id="step1-email-error" className="text-xs text-destructive">
                    {step1Errors.email}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="step1-password" className="text-sm font-medium">
                  Senha <span className="text-destructive">*</span> (mínimo 8 caracteres)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="step1-password"
                    type="password"
                    value={step1Password}
                    onChange={(e) => {
                      setStep1Password(e.target.value)
                      if (step1Errors.password) {
                        setStep1Errors((prev) => ({ ...prev, password: '' }))
                      }
                    }}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className={`pl-9 min-h-[44px] ${step1Errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={step1Submitting}
                    aria-invalid={Boolean(step1Errors.password)}
                    aria-describedby={step1Errors.password ? 'step1-password-error' : undefined}
                  />
                </div>
                {step1Errors.password && (
                  <p id="step1-password-error" className="text-xs text-destructive">
                    {step1Errors.password}
                  </p>
                )}
              </div>

              {/* Confirmar senha */}
              <div className="space-y-1.5">
                <Label htmlFor="step1-password-confirm" className="text-sm font-medium">
                  Confirmar senha <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="step1-password-confirm"
                    type="password"
                    value={step1PasswordConfirm}
                    onChange={(e) => {
                      setStep1PasswordConfirm(e.target.value)
                      if (step1Errors.passwordConfirm) {
                        setStep1Errors((prev) => ({ ...prev, passwordConfirm: '' }))
                      }
                    }}
                    placeholder="Repita sua senha"
                    autoComplete="new-password"
                    className={`pl-9 min-h-[44px] ${step1Errors.passwordConfirm ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={step1Submitting}
                    aria-invalid={Boolean(step1Errors.passwordConfirm)}
                    aria-describedby={
                      step1Errors.passwordConfirm ? 'step1-passwordConfirm-error' : undefined
                    }
                  />
                </div>
                {step1Errors.passwordConfirm && (
                  <p id="step1-passwordConfirm-error" className="text-xs text-destructive">
                    {step1Errors.passwordConfirm}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full font-semibold gap-2 min-h-[44px]"
                disabled={step1Submitting}
              >
                {step1Submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Criando conta...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar para Dados do Anúncio</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já possui uma conta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Faça login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  // ================= STEP 2 SCREEN =================
  const showTypeErr = step2Touched.type && Boolean(step2Errors.type || currentStep2Errors.type)
  const showNameErr = step2Touched.name && Boolean(step2Errors.name || currentStep2Errors.name)
  const showDescErr =
    step2Touched.description && Boolean(step2Errors.description || currentStep2Errors.description)
  const showEmailErr = step2Touched.email && Boolean(step2Errors.email || currentStep2Errors.email)
  const showCepErr = step2Touched.cep && Boolean(step2Errors.cep || currentStep2Errors.cep)
  const showAddressErr =
    step2Touched.address && Boolean(step2Errors.address || currentStep2Errors.address)
  const showCityErr = step2Touched.city && Boolean(step2Errors.city || currentStep2Errors.city)
  const showStateErr = step2Touched.state && Boolean(step2Errors.state || currentStep2Errors.state)
  const showTermsErr = step2Touched.terms && Boolean(step2Errors.terms || currentStep2Errors.terms)
  const showPrivacyErr =
    step2Touched.privacy && Boolean(step2Errors.privacy || currentStep2Errors.privacy)

  return (
    <div className="max-w-3xl mx-auto py-10 sm:py-16 px-4 animate-fade-in space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            Etapa 2 de 2 • Cadastro de Anúncio
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Cadastrar Novo Anúncio
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha as informações do seu negócio, produto ou solução para publicação.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>
              Logado como: <strong className="text-foreground">{user.email}</strong>
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleStep2Submit} noValidate>
        <Card className="shadow-lg border-border/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>Informações Principais</span>
            </CardTitle>
            <CardDescription>
              Campos essenciais para identificação da sua empresa ou solução no diretório.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Tipo e Nome */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Type Select */}
              <div className="space-y-1.5">
                <Label htmlFor="listing-type" className="text-sm font-medium">
                  Tipo de Cadastro <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={(val: ListingTypeOption) => {
                    setType(val)
                    markTouched('type')
                    setStep2Errors((prev) => ({ ...prev, type: '' }))
                  }}
                  disabled={step2Submitting}
                >
                  <SelectTrigger
                    id="listing-type"
                    className={`min-h-[44px] ${showTypeErr ? 'border-destructive ring-destructive' : ''}`}
                    aria-invalid={showTypeErr}
                    aria-describedby={showTypeErr ? 'type-error' : undefined}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa" className="min-h-[44px] flex items-center">
                      Empresa
                    </SelectItem>
                    <SelectItem value="negocio" className="min-h-[44px] flex items-center">
                      Negócio
                    </SelectItem>
                    <SelectItem value="solucao" className="min-h-[44px] flex items-center">
                      Solução
                    </SelectItem>
                    <SelectItem value="produto" className="min-h-[44px] flex items-center">
                      Produto
                    </SelectItem>
                  </SelectContent>
                </Select>
                {showTypeErr && (
                  <p id="type-error" className="text-xs text-destructive">
                    {step2Errors.type || currentStep2Errors.type}
                  </p>
                )}
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="listing-name" className="text-sm font-medium">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="listing-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setStep2Errors((prev) => ({ ...prev, name: '' }))
                  }}
                  onBlur={() => markTouched('name')}
                  placeholder="Nome da empresa, solução ou produto"
                  className={`min-h-[44px] ${showNameErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  disabled={step2Submitting}
                  aria-invalid={showNameErr}
                  aria-describedby={showNameErr ? 'name-error' : undefined}
                />
                {showNameErr && (
                  <p id="name-error" className="text-xs text-destructive">
                    {step2Errors.name || currentStep2Errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Descrição com live character counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="listing-description" className="text-sm font-medium">
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
                  aria-live="polite"
                >
                  {description.length} / 1000 caracteres
                </span>
              </div>
              <Textarea
                id="listing-description"
                rows={4}
                value={description}
                maxLength={1000}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setStep2Errors((prev) => ({ ...prev, description: '' }))
                }}
                onBlur={() => markTouched('description')}
                placeholder="Descreva as atividades, soluções fornecidas, diferenciais competitivos e público-alvo (máx. 1000 caracteres)..."
                className={`resize-y ${showDescErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                disabled={step2Submitting}
                aria-invalid={showDescErr}
                aria-describedby={showDescErr ? 'description-error' : undefined}
              />
              {showDescErr && (
                <p id="description-error" className="text-xs text-destructive">
                  {step2Errors.description || currentStep2Errors.description}
                </p>
              )}
            </div>

            {/* E-mail, Telefone, WhatsApp, Website */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* E-mail (prefilled) */}
              <div className="space-y-1.5">
                <Label htmlFor="listing-email" className="text-sm font-medium">
                  E-mail de Contato <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="listing-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setStep2Errors((prev) => ({ ...prev, email: '' }))
                    }}
                    onBlur={() => markTouched('email')}
                    placeholder="contato@empresa.com.br"
                    className={`pl-9 min-h-[44px] ${showEmailErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={step2Submitting}
                    aria-invalid={showEmailErr}
                    aria-describedby={showEmailErr ? 'email-error' : undefined}
                  />
                </div>
                {showEmailErr && (
                  <p id="email-error" className="text-xs text-destructive">
                    {step2Errors.email || currentStep2Errors.email}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-1.5">
                <Label htmlFor="listing-phone" className="text-sm font-medium">
                  Telefone (opcional)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="listing-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 3456-7890"
                    className="pl-9 min-h-[44px]"
                    disabled={step2Submitting}
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <Label htmlFor="listing-whatsapp" className="text-sm font-medium">
                  WhatsApp (opcional)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="listing-whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="pl-9 min-h-[44px]"
                    disabled={step2Submitting}
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-1.5">
                <Label htmlFor="listing-website" className="text-sm font-medium">
                  Website (opcional)
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="listing-website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.empresa.com.br"
                    className="pl-9 min-h-[44px]"
                    disabled={step2Submitting}
                  />
                </div>
              </div>
            </div>

            {/* Endereço & ViaCEP */}
            <div className="space-y-4 pt-2 border-t border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Localização e Endereço
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Digite o CEP para preenchimento automático de logradouro, bairro, cidade e
                    estado.
                  </p>
                </div>

                {isAddressManual && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary self-start sm:self-auto"
                    onClick={() => {
                      setIsAddressManual(false)
                      setCepErrorMsg(null)
                    }}
                  >
                    Tentar busca automática
                  </Button>
                )}
              </div>

              {/* CEP Input */}
              <div className="grid gap-4 sm:grid-cols-3 items-start">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="listing-cep" className="text-sm font-medium">
                    CEP (8 dígitos) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="listing-cep"
                      type="text"
                      maxLength={8}
                      value={cep}
                      onChange={handleCepChange}
                      onBlur={() => markTouched('cep')}
                      placeholder="01310100"
                      className={`pl-9 min-h-[44px] ${showCepErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      disabled={step2Submitting}
                      aria-invalid={showCepErr}
                      aria-describedby={showCepErr ? 'cep-error' : undefined}
                    />
                    {isCepLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  {showCepErr && (
                    <p id="cep-error" className="text-xs text-destructive">
                      {step2Errors.cep || currentStep2Errors.cep}
                    </p>
                  )}
                </div>

                {/* Inline ViaCEP notification */}
                <div className="sm:col-span-2 pt-1 sm:pt-6">
                  {cepErrorMsg ? (
                    <div
                      role="alert"
                      className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-700 dark:text-amber-400"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{cepErrorMsg}</span>
                    </div>
                  ) : isAddressManual ? (
                    <p className="text-xs text-muted-foreground">
                      Modo manual ativado: preencha os campos abaixo.
                    </p>
                  ) : address ? (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Endereço localizado com sucesso via CEP!
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Informe os 8 dígitos numéricos do CEP para preenchimento ágil.
                    </p>
                  )}
                </div>
              </div>

              {/* Campos preenchidos via CEP (disabled / readonly per sensible UX unless manual) */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Endereço / Logradouro */}
                <div className="space-y-1.5">
                  <Label htmlFor="listing-address" className="text-sm font-medium">
                    Endereço / Logradouro <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="listing-address"
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      setStep2Errors((prev) => ({ ...prev, address: '' }))
                    }}
                    onBlur={() => markTouched('address')}
                    placeholder="Rua, Avenida, Praça, Número..."
                    readOnly={!isAddressManual && Boolean(address)}
                    className={`min-h-[44px] ${
                      !isAddressManual && address ? 'bg-muted/50 cursor-default' : ''
                    } ${showAddressErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={step2Submitting}
                    aria-invalid={showAddressErr}
                    aria-describedby={showAddressErr ? 'address-error' : undefined}
                  />
                  {showAddressErr && (
                    <p id="address-error" className="text-xs text-destructive">
                      {step2Errors.address || currentStep2Errors.address}
                    </p>
                  )}
                </div>

                {/* Bairro */}
                <div className="space-y-1.5">
                  <Label htmlFor="listing-neighborhood" className="text-sm font-medium">
                    Bairro (opcional)
                  </Label>
                  <Input
                    id="listing-neighborhood"
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    readOnly={!isAddressManual && Boolean(neighborhood)}
                    className={`min-h-[44px] ${
                      !isAddressManual && neighborhood ? 'bg-muted/50 cursor-default' : ''
                    }`}
                    disabled={step2Submitting}
                  />
                </div>

                {/* Cidade */}
                <div className="space-y-1.5">
                  <Label htmlFor="listing-city" className="text-sm font-medium">
                    Cidade <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="listing-city"
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      setStep2Errors((prev) => ({ ...prev, city: '' }))
                    }}
                    onBlur={() => markTouched('city')}
                    placeholder="Cidade"
                    readOnly={!isAddressManual && Boolean(city)}
                    className={`min-h-[44px] ${
                      !isAddressManual && city ? 'bg-muted/50 cursor-default' : ''
                    } ${showCityErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={step2Submitting}
                    aria-invalid={showCityErr}
                    aria-describedby={showCityErr ? 'city-error' : undefined}
                  />
                  {showCityErr && (
                    <p id="city-error" className="text-xs text-destructive">
                      {step2Errors.city || currentStep2Errors.city}
                    </p>
                  )}
                </div>

                {/* Estado (UF) */}
                <div className="space-y-1.5">
                  <Label htmlFor="listing-state" className="text-sm font-medium">
                    Estado (UF) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="listing-state"
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value.toUpperCase())
                      setStep2Errors((prev) => ({ ...prev, state: '' }))
                    }}
                    onBlur={() => markTouched('state')}
                    placeholder="SP"
                    readOnly={!isAddressManual && Boolean(state)}
                    className={`min-h-[44px] uppercase ${
                      !isAddressManual && state ? 'bg-muted/50 cursor-default' : ''
                    } ${showStateErr ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={step2Submitting}
                    aria-invalid={showStateErr}
                    aria-describedby={showStateErr ? 'state-error' : undefined}
                  />
                  {showStateErr && (
                    <p id="state-error" className="text-xs text-destructive">
                      {step2Errors.state || currentStep2Errors.state}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Foto de Capa (Opcional, máx 5MB, JPG/PNG) */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <Label htmlFor="listing-photo" className="text-sm font-medium">
                Foto ou Logotipo (opcional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG ou PNG. Tamanho máximo: 5MB.
              </p>

              {photoPreview ? (
                <div className="flex items-center gap-4 rounded-xl border border-border p-3 bg-muted/30">
                  <img
                    src={photoPreview}
                    alt="Pré-visualização"
                    className="h-16 w-16 rounded-lg object-cover border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {photoFile?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removePhoto}
                    className="min-h-[44px] text-destructive hover:bg-destructive/10"
                    disabled={step2Submitting}
                  >
                    <X className="h-4 w-4 mr-1" /> Remover
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="listing-photo"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoChange}
                    disabled={step2Submitting}
                    className="min-h-[44px] cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    aria-describedby={photoError ? 'photo-error' : undefined}
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Upload className="h-4 w-4" />
                  </div>
                </div>
              )}

              {photoError && (
                <p id="photo-error" className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {photoError}
                </p>
              )}
            </div>

            {/* Map Pin Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border/80 p-4 bg-muted/20">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="listing-pin"
                  className="text-sm font-medium cursor-pointer text-foreground flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Exibir alfinete no mapa do diretório</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Habilita a exibição da localização geográfica no mapa interativo quando aprovado.
                </p>
              </div>
              <Switch
                id="listing-pin"
                checked={pinEnabled}
                onCheckedChange={setPinEnabled}
                disabled={step2Submitting}
                className="min-w-[44px] min-h-[24px]"
              />
            </div>

            {/* Checkboxes: Termos e Privacidade */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              {/* Termos */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="listing-terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => {
                    setTermsAccepted(Boolean(checked))
                    markTouched('terms')
                    if (checked) {
                      setStep2Errors((prev) => ({ ...prev, terms: '' }))
                    }
                  }}
                  disabled={step2Submitting}
                  className="mt-0.5 h-5 w-5"
                  aria-invalid={showTermsErr}
                  aria-describedby={showTermsErr ? 'terms-error' : undefined}
                />
                <div className="grid gap-1 leading-none">
                  <Label
                    htmlFor="listing-terms"
                    className="text-sm font-normal cursor-pointer text-foreground"
                  >
                    Li e concordo com os{' '}
                    <Link
                      to="/termos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium underline underline-offset-4 hover:text-primary/80"
                    >
                      Termos de Uso
                    </Link>{' '}
                    do Portal Viabilize <span className="text-destructive">*</span>
                  </Label>
                  {showTermsErr && (
                    <p id="terms-error" className="text-xs text-destructive">
                      {step2Errors.terms || currentStep2Errors.terms}
                    </p>
                  )}
                </div>
              </div>

              {/* Privacidade */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="listing-privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => {
                    setPrivacyAccepted(Boolean(checked))
                    markTouched('privacy')
                    if (checked) {
                      setStep2Errors((prev) => ({ ...prev, privacy: '' }))
                    }
                  }}
                  disabled={step2Submitting}
                  className="mt-0.5 h-5 w-5"
                  aria-invalid={showPrivacyErr}
                  aria-describedby={showPrivacyErr ? 'privacy-error' : undefined}
                />
                <div className="grid gap-1 leading-none">
                  <Label
                    htmlFor="listing-privacy"
                    className="text-sm font-normal cursor-pointer text-foreground"
                  >
                    Li e concordo com a{' '}
                    <Link
                      to="/privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium underline underline-offset-4 hover:text-primary/80"
                    >
                      Política de Privacidade
                    </Link>{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  {showPrivacyErr && (
                    <p id="privacy-error" className="text-xs text-destructive">
                      {step2Errors.privacy || currentStep2Errors.privacy}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/60">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 order-2 sm:order-1">
              <FileText className="h-4 w-4" />
              <span>Campos com * são de preenchimento obrigatório</span>
            </div>

            <Button
              type="submit"
              disabled={!isStep2Valid || step2Submitting}
              className="w-full sm:w-auto font-semibold gap-2 min-h-[44px] min-w-[200px] order-1 sm:order-2"
            >
              {step2Submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando cadastro...</span>
                </>
              ) : (
                <>
                  <span>Cadastrar Anúncio</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
