import React from 'react';
import { Sparkles, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, authError, user } = useAuth();

  if (!isOpen || user) return null;

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      onClose();
    } catch {
      // Handled in context
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-[#212121] text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-700/80 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Fechar"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-4">
          <Sparkles size={28} />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
          Entrar na Ask IA
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs leading-relaxed">
          Conecte-se com sua conta Google para salvar seu histórico de conversas, sincronizar dados e personalizar sua experiência.
        </p>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-sm border border-neutral-300 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
        >
          {/* Google multi-color SVG icon */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar com o Google</span>
        </button>

        {authError && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-3">{authError}</p>
        )}

        {/* Feature list */}
        <div className="w-full mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-left">
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span>Histórico sincronizado em qualquer dispositivo</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span>Pesquisa na Web e raciocínio avançado inclusos</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span>Geração de imagens e análise de fotos</span>
          </div>
        </div>

        {/* Continue as guest */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
        >
          Continuar sem login por enquanto
        </button>
      </div>
    </div>
  );
};
