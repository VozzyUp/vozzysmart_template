'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase-server'
import type { Contact, ContactStatus, CustomFieldDefinition } from '@/types'

const PAGE_SIZE = 50

export interface ContactsInitialData {
  contacts: Contact[]
  total: number
  stats: {
    total: number
    active: number
    optOut: number
    suppressed: number
  }
  tags: string[]
  customFields: CustomFieldDefinition[]
}

/**
 * Busca dados iniciais de contatos no servidor (RSC).
 * Usa cache() para deduplicação per-request.
 */
export const getContactsInitialData = cache(async (): Promise<ContactsInitialData> => {
  const supabase = await createClient()

  // Buscar tudo em paralelo
  // Stats: usar count exato por status (evita limite de 1000 linhas do select('status'))
  const [contactsResult, totalCount, optInCount, optOutCount, suppressedCount, tagsResult, customFieldsResult] = await Promise.all([
    // Primeira página de contatos
    supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1),

    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'Opt-in'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'Opt-out'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'SUPPRESSED'),

    // Tags únicas
    supabase
      .from('contacts')
      .select('tags')
      .not('tags', 'is', null),

    // Campos customizados
    supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('entity_type', 'contact')
      .order('name')
  ])

  // Mapear contatos
  const contacts: Contact[] = (contactsResult.data || []).map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    status: c.status as ContactStatus,
    tags: c.tags || [],
    lastActive: c.last_active || c.updated_at || c.created_at,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    custom_fields: c.custom_fields,
    suppressionReason: c.suppression_reason,
    suppressionSource: c.suppression_source,
    suppressionExpiresAt: c.suppression_expires_at
  }))

  // Extrair tags únicas
  const allTags = new Set<string>()
  ;(tagsResult.data || []).forEach(row => {
    if (Array.isArray(row.tags)) {
      row.tags.forEach((tag: string) => allTags.add(tag))
    }
  })

  const computedStats = {
    total: totalCount.count ?? 0,
    active: optInCount.count ?? 0,
    optOut: optOutCount.count ?? 0,
    suppressed: suppressedCount.count ?? 0
  }

  return {
    contacts,
    total: contactsResult.count ?? 0,
    stats: {
      total: computedStats.total,
      active: computedStats.active,
      optOut: computedStats.optOut,
      suppressed: computedStats.suppressed
    },
    tags: Array.from(allTags).toSorted(),
    customFields: (customFieldsResult.data || []) as CustomFieldDefinition[]
  }
})
