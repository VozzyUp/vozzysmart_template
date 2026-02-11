import { Contact, ContactStatus } from '../types';
import {
  processPhoneNumber
} from '../lib/phone-formatter';
import {
  parseContactsFile,
  parseContactsFromFile,
  generateImportReport,
  type ParseOptions
} from '../lib/csv-parser';
import { logger } from '../lib/logger';

export interface ContactStats {
  total: number;
  optIn: number;
  optOut: number;
}

export interface ImportResult {
  imported: number;
  failed: number;
  duplicates: number;
  report: string;
}

export interface ContactListParams {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  tag?: string;
}

export interface ContactListResult {
  data: Contact[];
  total: number;
  limit: number;
  offset: number;
}

/** Tamanho de cada lote na importação (evita limite de body/timeout com >1000 contatos) */
const IMPORT_CHUNK_SIZE = 1000;

/**
 * Contact Service
 * All data is stored in Main Database (source of truth)
 */
export const contactService = {
  getAll: async (): Promise<Contact[]> => {
    const response = await fetch('/api/contacts', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Falha ao buscar contatos');
    }
    return response.json();
  },

  getById: async (id: string): Promise<Contact | undefined> => {
    const response = await fetch(`/api/contacts/${id}`, { cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 404) return undefined;
      return undefined;
    }
    return response.json();
  },

  getStats: async (): Promise<ContactStats> => {
    const response = await fetch('/api/contacts/stats', { cache: 'no-store' });
    if (!response.ok) {
      return { total: 0, optIn: 0, optOut: 0 };
    }
    return response.json();
  },

  getTags: async (): Promise<string[]> => {
    const response = await fetch('/api/contacts/tags', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Falha ao buscar tags');
    }
    return response.json();
  },

  list: async (params: ContactListParams): Promise<ContactListResult> => {
    const searchParams = new URLSearchParams();
    searchParams.set('limit', String(params.limit));
    searchParams.set('offset', String(params.offset));
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.tag && params.tag !== 'ALL') searchParams.set('tag', params.tag);

    const response = await fetch(`/api/contacts?${searchParams.toString()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Falha ao buscar contatos');
    }
    return response.json();
  },

  getIds: async (params: { search?: string; status?: string; tag?: string }): Promise<string[]> => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.tag && params.tag !== 'ALL') searchParams.set('tag', params.tag);

    const qs = searchParams.toString();
    const response = await fetch(`/api/contacts/ids${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Falha ao buscar IDs de contatos');
    }
    return response.json();
  },

  /**
   * Add a single contact with phone validation
   */
  add: async (contact: Omit<Contact, 'id' | 'lastActive'>): Promise<Contact> => {
    const { normalized, validation } = processPhoneNumber(contact.phone);

    if (!validation.isValid) {
      logger.warn('Invalid phone number rejected', {
        phone: contact.phone,
        error: validation.error
      });
      throw new Error(validation.error || 'Número de telefone inválido');
    }

    const normalizedContact = {
      ...contact,
      phone: normalized,
    };

    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedContact),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao adicionar contato');
    }

    logger.info('Contact added', {
      name: contact.name,
      phone: normalized
    });

    return response.json();
  },

  /**
   * Validate a phone number without saving
   */
  validatePhone: (phone: string): { isValid: boolean; error?: string; normalized?: string } => {
    const { normalized, validation } = processPhoneNumber(phone);
    return {
      isValid: validation.isValid,
      error: validation.error,
      normalized: validation.isValid ? normalized : undefined,
    };
  },

  update: async (
    id: string,
    data: (Partial<Omit<Contact, 'id'>> & { email?: string | null })
  ): Promise<Contact | undefined> => {
    if (data.phone) {
      const { normalized, validation } = processPhoneNumber(data.phone);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Número de telefone inválido');
      }
      data.phone = normalized;
    }

    const response = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) return undefined;
    return response.json();
  },

  /**
   * Import contacts from CSV/TXT file content
   * Usa import() em lotes para suportar mais de 1000 contatos
   */
  importFromContent: async (
    content: string,
    options?: ParseOptions
  ): Promise<ImportResult> => {
    logger.info('Starting contact import', { contentLength: content.length });

    const parseResult = parseContactsFile(content, options);

    if (!parseResult.success) {
      throw new Error('Falha ao processar arquivo');
    }

    const contactsToImport = parseResult.contacts.map(c => ({
      name: c.name || 'Desconhecido',
      phone: c.phone,
      status: ContactStatus.OPT_IN,
      tags: [] as string[],
    }));

    const { inserted, updated } = await contactService.import(contactsToImport);
    const imported = inserted + updated;

    const result: ImportResult = {
      imported,
      failed: parseResult.invalidRows.length,
      duplicates: parseResult.duplicates.length,
      report: generateImportReport(parseResult),
    };

    logger.info('Contact import completed', { ...result });

    return result;
  },

  /**
   * Import contacts from File object (browser)
   * Usa import() em lotes para suportar mais de 1000 contatos
   */
  importFromFile: async (
    file: File,
    options?: ParseOptions
  ): Promise<ImportResult> => {
    const parseResult = await parseContactsFromFile(file, options);

    const contactsToImport = parseResult.contacts.map(c => ({
      name: c.name || 'Desconhecido',
      phone: c.phone,
      status: ContactStatus.OPT_IN,
      tags: [] as string[],
    }));

    const { inserted, updated } = await contactService.import(contactsToImport);

    return {
      imported: inserted + updated,
      failed: parseResult.invalidRows.length,
      duplicates: parseResult.duplicates.length,
      report: generateImportReport(parseResult),
    };
  },

  /**
   * Import contacts with merge strategy
   * - New contacts: inserted
   * - Existing contacts (by phone): updated with merged tags
   * - Envia em lotes de IMPORT_CHUNK_SIZE para evitar erro com >1000 contatos (body/timeout)
   */
  import: async (contacts: Omit<Contact, 'id' | 'lastActive'>[]): Promise<{ inserted: number; updated: number }> => {
    const validContacts = contacts
      .map(c => {
        const { normalized, validation } = processPhoneNumber(c.phone);
        if (!validation.isValid) return null;
        return { ...c, phone: normalized };
      })
      .filter((c): c is Omit<Contact, 'id' | 'lastActive'> => c !== null);

    logger.info('Import contacts', {
      total: contacts.length,
      valid: validContacts.length
    });

    let totalInserted = 0;
    let totalUpdated = 0;
    for (let i = 0; i < validContacts.length; i += IMPORT_CHUNK_SIZE) {
      const chunk = validContacts.slice(i, i + IMPORT_CHUNK_SIZE);
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: chunk }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao importar contatos');
      }

      const { inserted = 0, updated = 0 } = await response.json();
      totalInserted += inserted;
      totalUpdated += updated;
    }

    return { inserted: totalInserted, updated: totalUpdated };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/contacts/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao deletar contato');
    }
  },

  deleteMany: async (ids: string[]): Promise<number> => {
    const response = await fetch('/api/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Falha ao deletar contatos');
    }

    const { deleted } = await response.json();
    return deleted;
  }
};
