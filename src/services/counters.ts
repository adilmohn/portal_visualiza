/**
 * Serviço de contadores do Portal Viabilize.
 *
 * - `portal_visits`            : total global de visitas ao portal (header).
 * - `listing_clicks:<id>`      : cliques/aberturas por anúncio (detalhe e cards).
 *
 * Todos os pedidos são fire-and-forget e falham em silêncio: nenhum erro
 * do contador pode quebrar o carregamento das páginas.
 */

import pb from '@/lib/pocketbase/client'

export const PORTAL_VISITS_KEY = 'portal_visits'

export const listingClicksKey = (listingId: string): string => `listing_clicks:${listingId}`

export interface CounterValues {
  [key: string]: number
}

/** Chave de deduplicação por sessão (sessionStorage) */
function sessionFlag(scope: 'portal' | 'listing', id?: string): string {
  return scope === 'portal' ? 'viabilize_counter_portal' : `viabilize_counter_listing_${id}`
}

function wasCountedInSession(scope: 'portal' | 'listing', id?: string): boolean {
  try {
    return sessionStorage.getItem(sessionFlag(scope, id)) === '1'
  } catch (_) {
    return false
  }
}

function markCountedInSession(scope: 'portal' | 'listing', id?: string): void {
  try {
    sessionStorage.setItem(sessionFlag(scope, id), '1')
  } catch (_) {
    // Sem sessionStorage (navegador restritivo): conta mesmo assim
  }
}

/**
 * Lê o valor de um ou mais contadores. Retorna {} em caso de falha.
 */
export async function getCounters(keys: string[]): Promise<CounterValues> {
  if (keys.length === 0) return {}
  try {
    const res = await fetch(
      `${pb.buildURL('')}/backend/v1/counters?key=${encodeURIComponent(keys.join(','))}`,
    )
    if (!res.ok) return {}
    const data = (await res.json()) as { values?: CounterValues }
    return data.values || {}
  } catch (_) {
    return {}
  }
}

/** Lê o total global de visitas ao portal (0 em caso de falha). */
export async function getPortalVisits(): Promise<number> {
  const values = await getCounters([PORTAL_VISITS_KEY])
  return values[PORTAL_VISITS_KEY] ?? 0
}

/**
 * Incrementa o contador global de visitas do portal (uma vez por sessão).
 * Fire-and-forget: nunca lança.
 */
export function trackPortalVisit(): void {
  if (wasCountedInSession('portal')) return
  markCountedInSession('portal')
  try {
    fetch(`${pb.buildURL('')}/backend/v1/events/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'portal' }),
    }).catch(() => {})
  } catch (_) {
    // silencioso
  }
}

/**
 * Incrementa o contador de cliques de um anúncio (uma vez por sessão).
 * Fire-and-forget: nunca lança.
 */
export function trackListingClick(listingId: string): void {
  if (!listingId) return
  if (wasCountedInSession('listing', listingId)) return
  markCountedInSession('listing', listingId)
  try {
    fetch(`${pb.buildURL('')}/backend/v1/events/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'listing', listingId }),
    }).catch(() => {})
  } catch (_) {
    // silencioso
  }
}

/** Formata um número no padrão pt-BR (ex.: 1.234). */
export function formatCounterValue(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR').format(value)
}
