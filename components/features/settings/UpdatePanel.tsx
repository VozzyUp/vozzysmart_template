'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, CheckCircle2, AlertCircle, ExternalLink, GitBranch } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { toast } from 'sonner';

interface UpdateStatus {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  tagName?: string;
  configured: boolean;
  error?: string;
}

export const UpdatePanel: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkUpdates = async (silent = false) => {
    if (!silent) setIsChecking(true);
    try {
      const res = await fetch('/api/system/update/check');
      const data = await res.json();
      setStatus(data);
      
      if (!silent && data.available) {
        toast.info(`Nova atualização disponível: v${data.latestVersion}`);
      } else if (!silent && !data.available && !data.error) {
        toast.success('Você já está na versão mais recente.');
      }
    } catch (err) {
      console.error('Failed to check updates:', err);
      if (!silent) toast.error('Erro ao verificar atualizações.');
    } finally {
      setIsChecking(false);
    }
  };

  const applyUpdate = async () => {
    if (!confirm('Isso irá sincronizar seu fork com o repositório principal e disparar um novo deploy no Vercel. Deseja continuar?')) {
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/system/update/apply', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Sincronização iniciada!');
        // Refresh status after a bit
        setTimeout(() => checkUpdates(true), 5000);
      } else {
        toast.error(data.error || 'Erro ao aplicar atualização.');
      }
    } catch (err) {
      console.error('Update apply error:', err);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    checkUpdates(true);
  }, []);

  return (
    <Container variant="glass" padding="lg" className="border-[var(--ds-border-default)]">
      <div className="flex items-start gap-6">
        <div className="p-4 rounded-2xl border bg-[var(--ds-bg-elevated)] text-[var(--ds-text-primary)] border-[var(--ds-border-default)]">
          <GitBranch size={32} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-[var(--ds-text-primary)]">
              Sistema & Atualizações
            </h3>
            {status?.available && (
              <span className="px-2 py-0.5 bg-primary-500/10 text-primary-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-primary-500/20">
                Update Disponível
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--ds-text-muted)]">Versão Atual:</span>
              <code className="text-[var(--ds-text-primary)] font-mono font-bold">
                v{status?.currentVersion || '---'}
              </code>
            </div>
            
            {status?.error && (
              <div className="flex items-center gap-2 text-xs text-[var(--ds-status-error-text)] mt-1">
                <AlertCircle size={12} />
                <span>{status.error}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => checkUpdates()}
              disabled={isChecking || isUpdating}
              className="h-10 px-4 flex items-center gap-2 text-sm font-medium bg-[var(--ds-bg-hover)] text-[var(--ds-text-primary)] rounded-xl border border-[var(--ds-border-default)] hover:border-[var(--ds-border-strong)] transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
              Verificar Atualização
            </button>

            {status?.available && (
              <button
                onClick={applyUpdate}
                disabled={isUpdating}
                className="h-10 px-4 flex items-center gap-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isUpdating ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Atualizar Agora
              </button>
            )}

            {!status?.available && status?.configured && !isChecking && (
              <div className="flex items-center gap-2 text-xs text-[var(--ds-status-success-text)] font-medium bg-[var(--ds-status-success-bg)] px-3 py-2 rounded-xl border border-[var(--ds-status-success)]/20">
                <CheckCircle2 size={14} />
                Você está na versão mais recente
              </div>
            )}
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <a 
            href="https://github.com/VozzySmart/VozzySmart_Template" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] transition-colors"
          >
            Ver Repositório
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </Container>
  );
};
