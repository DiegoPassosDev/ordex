'use client';

import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

function ToastContent({ t }: { t: any }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isSuccess = t.type === 'success';
  const isError = t.type === 'error';
  const isLoading = t.type === 'loading';

  const accentColor = isSuccess
    ? '#16a34a'
    : isError
    ? '#dc2626'
    : isLoading
    ? '#f97316'
    : '#3b82f6';

  const IconComponent = isSuccess
    ? CheckCircle
    : isError
    ? XCircle
    : AlertCircle;

  // Cores baseadas no tema
  const bg = isDark ? '#1f2937' : '#dde5ee';
  const border = isDark ? `${accentColor}40` : `${accentColor}30`;
  const textColor = isDark ? '#f9fafb' : '#111827';
  const closeColor = isDark ? '#6b7280' : '#9ca3af';
  const progressBg = isDark ? `${accentColor}25` : `${accentColor}20`;
  const shadow = isDark
    ? '0 4px 24px rgba(0,0,0,0.4)'
    : '0 4px 24px rgba(0,0,0,0.12)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: bg,
        borderRadius: '12px',
        boxShadow: shadow,
        border: `1px solid ${border}`,
        overflow: 'hidden',
        minWidth: '300px',
        maxWidth: '420px',
        opacity: t.visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Conteúdo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>

        {/* Ícone */}
        {isLoading ? (
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            border: `2px solid ${accentColor}30`,
            borderTopColor: accentColor,
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
        ) : (
          <IconComponent
            style={{ color: accentColor, flexShrink: 0 }}
            size={22}
            strokeWidth={2.5}
          />
        )}

        {/* Mensagem */}
        <span style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 500,
          color: textColor,
          lineHeight: '1.4',
          textAlign: 'center',
        }}>
          {t.message}
        </span>

        {/* Botão fechar */}
        {!isLoading && (
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', borderRadius: '6px', flexShrink: 0,
              color: closeColor, display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      {!isLoading && (
        <div style={{ height: '3px', background: progressBg, position: 'relative' }}>
          <div
            style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              background: accentColor,
              animation: `shrink ${t.duration ?? 3500}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function CustomToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: { padding: 0, background: 'transparent', boxShadow: 'none' },
      }}
    >
      {(t) => (
        <ToastBar toast={t} style={{ padding: 0, background: 'transparent', boxShadow: 'none' }}>
          {() => <ToastContent t={t} />}
        </ToastBar>
      )}
    </Toaster>
  );
}
export { toast } from 'react-hot-toast';