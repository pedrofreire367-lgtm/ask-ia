import React, { useState } from 'react';
import {
  X,
  Sliders,
  User,
  Volume2,
  Database,
  Trash2,
  Download,
  Moon,
  Sun,
  Monitor,
  Check,
  Sparkles,
  Play,
  LogOut,
} from 'lucide-react';
import { Conversation, UserSettings } from '../types';
import { exportAllDataAsJSON } from '../utils/storage';
import { SpeechHandler } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  conversations: Conversation[];
  onClearAllConversations: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  conversations,
  onClearAllConversations,
}) => {
  const { user, loginWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'custom' | 'speech' | 'data'>('general');
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleTestSpeech = () => {
    SpeechHandler.speak('Olá! Eu sou a Ask IA, pronta para ajudar você com qualquer tarefa.', {
      rate: formData.speechRate,
    });
  };

  const totalMessages = conversations.reduce((acc, c) => acc + c.messages.length, 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-[#212121] text-neutral-900 dark:text-neutral-100 rounded-3xl border border-neutral-200 dark:border-neutral-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Configurações da Ask IA</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Personalize comportamento, temas e recursos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body with side tabs */}
        <div className="flex flex-1 min-h-[380px] overflow-hidden">
          {/* Navigation tabs */}
          <div className="w-48 bg-neutral-50 dark:bg-[#191919] p-3 border-r border-neutral-200 dark:border-neutral-800 space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeTab === 'general'
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/40'
              }`}
            >
              <Sliders size={16} />
              <span>Geral</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeTab === 'custom'
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/40'
              }`}
            >
              <User size={16} />
              <span>Personalização</span>
            </button>
            <button
              onClick={() => setActiveTab('speech')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeTab === 'speech'
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/40'
              }`}
            >
              <Volume2 size={16} />
              <span>Voz e Áudio</span>
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeTab === 'data'
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/40'
              }`}
            >
              <Database size={16} />
              <span>Dados e Backup</span>
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* 1. General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Google Account Section */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Conta de Usuário
                  </label>
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'Google'}
                            className="w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-neutral-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                            {(user.displayName || user.email || 'U').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {user.displayName || 'Usuário Google'}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {user.email} • Conectado via Google
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={logout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>Sair</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                          Faça login com o Google para salvar histórico de conversas na nuvem.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={loginWithGoogle}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 border border-neutral-300 dark:border-neutral-600 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-xs transition-colors shrink-0 cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                        <span>Entrar com Google</span>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Aparência do Tema
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'dark', label: 'Escuro', icon: Moon },
                      { id: 'light', label: 'Claro', icon: Sun },
                      { id: 'system', label: 'Sistema', icon: Monitor },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = formData.theme === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, theme: item.id as any })}
                          className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                          }`}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Modelo Padrão
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="gemini-3.8-flash">Ask IA 4.0 (Gemini 3.8 Flash - Mais Inteligente)</option>
                    <option value="gemini-3.1-flash-lite">Ask IA Mini (Gemini 3.1 Flash Lite - Ultrarrápido)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-semibold block">Efeitos sonoros</span>
                      <span className="text-xs text-neutral-500">Emitir som discreto ao concluir respostas</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.soundEnabled}
                      onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 2. Custom Instructions Tab */}
            {activeTab === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Como a Ask IA deve responder?
                  </label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    Defina o tom, estilo, formato ou regras (ex.: "Sempre direto e objetivo", "Prefira respostas em tópicos", "Foco em código TypeScript limpo").
                  </p>
                  <textarea
                    rows={4}
                    value={formData.customInstructions}
                    onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                    placeholder="Exemplo: Responda de forma concisa, evite introduções longas, forneça soluções prontas para uso com exemplos práticos."
                    className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    O que a Ask IA deve saber sobre você?
                  </label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    Sua profissão, localização, linguagens ou interesses para que as respostas sejam adaptadas.
                  </p>
                  <textarea
                    rows={3}
                    value={formData.userBio}
                    onChange={(e) => setFormData({ ...formData, userBio: e.target.value })}
                    placeholder="Exemplo: Sou desenvolvedor de software, atuo com React e Node.js. Prefiro explicações focadas em boas práticas de arquitetura."
                    className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 3. Speech and Audio Tab */}
            {activeTab === 'speech' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold">Velocidade da Voz</label>
                    <span className="text-xs font-mono text-emerald-500">{formData.speechRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.6"
                    step="0.1"
                    value={formData.speechRate}
                    onChange={(e) => setFormData({ ...formData, speechRate: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
                    <span>Mais lenta (0.7x)</span>
                    <span>Padrão (1.0x)</span>
                    <span>Rápida (1.6x)</span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleTestSpeech}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    <Play size={14} className="text-emerald-500" />
                    <span>Ouvir demonstração de voz</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-semibold block">Reprodução automática</span>
                      <span className="text-xs text-neutral-500">
                        Ler em voz alta automaticamente cada resposta gerada pela Ask IA
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.autoSpeak}
                      onChange={(e) => setFormData({ ...formData, autoSpeak: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 4. Data and Backup Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 block">
                        {conversations.length}
                      </span>
                      <span className="text-xs text-neutral-500">Conversas salvas</span>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 block">
                        {totalMessages}
                      </span>
                      <span className="text-xs text-neutral-500">Mensagens trocadas</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Exportar Dados</h4>
                  <p className="text-xs text-neutral-500 mb-3">
                    Faça download de todas as suas conversas e configurações em formato JSON estruturado.
                  </p>
                  <button
                    type="button"
                    onClick={() => exportAllDataAsJSON(conversations, formData)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Download size={14} />
                    <span>Baixar Backup Completo (.json)</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                    Zona de Perigo
                  </h4>
                  <p className="text-xs text-neutral-500 mb-3">
                    Excluir permanentemente todo o histórico de conversas deste navegador.
                  </p>

                  {confirmClear ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClearAllConversations();
                          setConfirmClear(false);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                      >
                        Sim, apagar tudo agora
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="px-3.5 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Limpar todas as conversas</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-neutral-50 dark:bg-[#191919] border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-400">
            Ask IA v4.0 • Gemini 3.8
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check size={14} />
                  <span>Salvo!</span>
                </>
              ) : (
                <span>Salvar alterações</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
