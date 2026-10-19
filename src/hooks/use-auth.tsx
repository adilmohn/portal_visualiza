import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export type UserRole = 'cadastrado' | 'anunciante' | 'admin'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: UserRole
  avatar?: string
  created?: string
  updated?: string
}

export interface SignUpData {
  email: string
  password: string
  passwordConfirm?: string
  name?: string
}

export interface SignInData {
  email: string
  password: string
}

interface AuthContextValue {
  user: AuthUser | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapRecordToAuthUser(record: RecordModel | null): AuthUser | null {
  if (!record) return null
  const roleRaw = (record.role as string | undefined) || 'cadastrado'
  const role: UserRole = roleRaw === 'admin' || roleRaw === 'anunciante' ? roleRaw : 'cadastrado'

  return {
    id: record.id,
    email: record.email || '',
    name: (record.name as string | undefined) || undefined,
    role,
    avatar: (record.avatar as string | undefined) || undefined,
    created: record.created,
    updated: record.updated,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    return pb.authStore.isValid && pb.authStore.record
      ? mapRecordToAuthUser(pb.authStore.record)
      : null
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Initial check & subscribe to authStore changes
    const updateFromAuthStore = () => {
      if (pb.authStore.isValid && pb.authStore.record) {
        setUser(mapRecordToAuthUser(pb.authStore.record))
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }

    updateFromAuthStore()

    // Refresh auth token with backend if stored session exists
    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then((authData) => {
          setUser(mapRecordToAuthUser(authData.record))
        })
        .catch(() => {
          // Token expired or invalid, clear auth store
          pb.authStore.clear()
          setUser(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }

    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(mapRecordToAuthUser(model))
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (data: SignInData): Promise<{ success: boolean; error?: string }> => {
    try {
      const authData = await pb
        .collection('users')
        .authWithPassword(data.email.trim(), data.password)
      setUser(mapRecordToAuthUser(authData.record))
      return { success: true }
    } catch (err) {
      const message = getErrorMessage(err)
      return {
        success: false,
        error: message.includes('Failed to authenticate')
          ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
          : message || 'Falha ao autenticar.',
      }
    }
  }

  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      const password = data.password
      const passwordConfirm = data.passwordConfirm ?? password

      // Create user record
      await pb.collection('users').create({
        email: data.email.trim(),
        password,
        passwordConfirm,
        name: data.name?.trim() || '',
        role: 'cadastrado',
      })

      // Automatically sign in the newly registered user
      const authData = await pb.collection('users').authWithPassword(data.email.trim(), password)
      setUser(mapRecordToAuthUser(authData.record))

      return { success: true }
    } catch (err) {
      const message = getErrorMessage(err)
      return {
        success: false,
        error: message || 'Falha ao criar conta. Verifique os dados informados.',
      }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      if (pb.authStore.isValid) {
        const authData = await pb.collection('users').authRefresh()
        setUser(mapRecordToAuthUser(authData.record))
      }
    } catch {
      signOut()
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user && pb.authStore.isValid,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider />')
  }
  return context
}
