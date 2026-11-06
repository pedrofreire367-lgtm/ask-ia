import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  MoreHorizontal,
  Pin,
  Trash2,
  Edit2,
  Download,
  Settings,
  PanelLeftClose,
  Sparkles,
  X,
  Check,
  LogOut,
  LogIn,
} from 'lucide-react';
import { Conversation, UserSettings } from '../types';
import { exportConversationAsMarkdown } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  settings: UserSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onOpenSettings,
  onOpenLogin,
  isOpen,
  onToggleSidebar,
  settings,
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Group conversations by time
  const groupedConversations = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const pinned: Conversation[] = [];
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const last30Days: Conversation[] = [];
    const older: Conversation[] = [];

    // Sort by updatedAt descending
    const sorted = [...filteredConversations].sort((a, b) => b.updatedAt - a.updatedAt);

    for (const conv of sorted) {
      if (conv.pinned) {
        pinned.push(conv);
        continue;
      }

      const diff = now - conv.updatedAt;
      if (diff < oneDay) {
        today.push(conv);
      } else if (diff < 2 * oneDay) {
        yesterday.push(conv);
      } else if (diff < 7 * oneDay) {
        last7Days.push(conv);
      } else if (diff < 30 * oneDay) {
        last30Days.push(conv);
      } else {
        older.push(conv);
      }
    }

    return [
      { label: 'Fixadas', items: pinned, icon: Pin },
      { label: 'Hoje', items: today },
      { label: 'Ontem', items: yesterday },
      { label: 'Últimos 7 dias', items: last7Days },
      { label: 'Últimos 30 dias', items: last30Days },
      { label: 'Mais antigas', items: older },
    ].filter((group) => group.items.length > 0);
  }, [filteredConversations]);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-64 md:w-72 h-full flex flex-col bg-[#f9f9f9] dark:bg-[#171717] border-r border-neutral-200 dark:border-neutral-800 shrink-0 select-none transition-all duration-300 z-30">
      {/* Sidebar Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-neutral-200/70 dark:border-neutral-800/80">
        <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 tracking-tight text-lg">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <span>Ask IA</span>
        </div>

        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Fechar barra lateral"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 font-medium text-sm transition-all shadow-sm cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Plus size={18} className="transition-transform group-hover:rotate-90 duration-200" />
            <span>Nova conversa</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/10">
            Ctrl K
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-neutral-200/50 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2">
        {groupedConversations.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-neutral-400">
            {searchQuery ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda.'}
          </div>
        ) : (
          groupedConversations.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {group.icon && <group.icon size={11} />}
                <span>{group.label}</span>
              </div>

              {group.items.map((conv) => {
                const isActive = conv.id === currentId;
                const isEditing = editingId === conv.id;

                if (isEditing) {
                  return (
                    <div
                      key={conv.id}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-emerald-500 shadow-xs"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(conv.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 text-xs bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(conv.id)}
                        className="p-1 text-emerald-500 hover:text-emerald-600"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-neutral-400 hover:text-neutral-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {conv.pinned ? (
                        <Pin size={13} className="text-emerald-500 shrink-0 rotate-45" />
                      ) : (
                        <MessageSquare size={13} className="text-neutral-400 shrink-0" />
                      )}
                      <span className="truncate">{conv.title || 'Conversa sem título'}</span>
                    </div>

                    {/* Action Menu Trigger */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === conv.id ? null : conv.id);
                        }}
                        className={`p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-300/40 dark:hover:bg-neutral-700 transition-opacity ${
                          isActive || activeMenuId === conv.id
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Opções"
                      >
                        <MoreHorizontal size={14} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === conv.id && (
                        <div
                          ref={menuRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-6 w-44 rounded-xl bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95"
                        >
                          <button
                            onClick={() => {
                              onTogglePinConversation(conv.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Pin size={13} />
                            <span>{conv.pinned ? 'Desafixar' : 'Fixar no topo'}</span>
                          </button>
                          <button
                            onClick={() => handleStartRename(conv)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Edit2 size={13} />
                            <span>Renomear</span>
                          </button>
                          <button
                            onClick={() => {
                              exportConversationAsMarkdown(conv);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Download size={13} />
                            <span>Exportar (.md)</span>
                          </button>
                          <div className="my-1 border-t border-neutral-200 dark:border-neutral-700/60" />
                          <button
                            onClick={() => {
                              onDeleteConversation(conv.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 size={13} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* User Footer Profile & Settings */}
      <div className="p-3 border-t border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-100/50 dark:bg-neutral-900/40">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuário'}
                  className="w-8 h-8 rounded-full object-cover shadow-xs border border-neutral-300 dark:border-neutral-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                  {(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {user.displayName || 'Usuário Google'}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Configurações da IA"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Sair da conta"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onOpenLogin}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-xs transition-all cursor-pointer"
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

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Configurações da IA"
            >
              <Settings size={17} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
