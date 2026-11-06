import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
  PanelLeft,
  Share2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Brain,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Image as ImageIcon,
  Download,
  Maximize2,
  Sun,
  Moon,
  ExternalLink,
  Code,
  Lightbulb,
  Compass,
  Palette,
} from 'lucide-react';
import { Message, Conversation, UserSettings, Attachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ModelSelector } from './ModelSelector';
import { ChatInput } from './ChatInput';
import { SpeechHandler } from '../utils/audio';

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (
    text: string,
    options: {
      attachments: Attachment[];
      webSearch: boolean;
      deepThinking: boolean;
      generateImage: boolean;
    }
  ) => void;
  onStopGenerating: () => void;
  onRegenerate: () => void;
  onSelectModel: (model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite') => void;
  onNewConversation: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  settings: UserSettings;
  onToggleTheme: () => void;
  onViewImage: (url: string, prompt?: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onSendMessage,
  onStopGenerating,
  onRegenerate,
  onSelectModel,
  onNewConversation,
  onToggleSidebar,
  isSidebarOpen,
  settings,
  onToggleTheme,
  onViewImage,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, 'up' | 'down'>>({});
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages || [];
  const isGenerating = messages.some((m) => m.isGenerating);

  // Auto-scroll to bottom on new message or chunk
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollBottom]);

  // Monitor scroll position to show/hide "scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      SpeechHandler.stop();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      SpeechHandler.speak(text, {
        rate: settings.speechRate,
        onEnd: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    }
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setLikedMap((prev) => ({
      ...prev,
      [id]: prev[id] === type ? undefined! : type,
    }));
  };

  const toggleThinking = (id: string) => {
    setExpandedThinking((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Suggestion chips for empty state
  const suggestions = [
    {
      icon: Lightbulb,
      category: 'Criar e Redigir',
      prompt: 'Escreva um roteiro dinâmico e envolvente para um podcast sobre as maiores inovações de IA.',
    },
    {
      icon: Code,
      category: 'Programação',
      prompt: 'Explique a diferença técnica entre Promises, async/await e observables com exemplos de código limpo.',
    },
    {
      icon: Globe,
      category: 'Pesquisa Web',
      prompt: 'Quais são as notícias e avanços científicos mais recentes de destaque esta semana?',
      webSearch: true,
    },
    {
      icon: Palette,
      category: 'Criar Imagem',
      prompt: 'Gere uma ilustração cinematográfica 3D de uma cidade futurista verde e sustentável ao pôr do sol.',
      generateImage: true,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#212121] text-neutral-900 dark:text-neutral-100 relative">
      {/* Top Navbar */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 shrink-0 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Abrir barra lateral"
            >
              <PanelLeft size={19} />
            </button>
          )}

          {/* Model Selector dropdown */}
          <ModelSelector
            currentModel={conversation?.model || settings.model}
            onSelectModel={onSelectModel}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Alternar tema claro/escuro"
          >
            {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Share conversation */}
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: conversation?.title || 'Conversa Ask IA',
                    text: `Confira minha conversa com a Ask IA!`,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copiado para a área de transferência!');
                }
              }}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Compartilhar conversa"
            >
              <Share2 size={18} />
            </button>
          )}

          {/* New Chat Top Button */}
          <button
            onClick={onNewConversation}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <Sparkles size={14} className="text-emerald-500" />
            <span>Novo Chat</span>
          </button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto py-6">
          {/* Empty State / Welcome Screen */}
          {messages.length === 0 ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              {/* Emblem */}
              <div className="w-16 h-16 rounded-3xl bg-emerald-600/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-inner">
                <Sparkles size={34} />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
                Como posso ajudar você hoje?
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-8">
                Sou a <strong>Ask IA</strong>, seu assistente inteligente com raciocínio avançado, pesquisa na web, visão e geração de ideias.
              </p>

              {/* 4 Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                {suggestions.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        onSendMessage(item.prompt, {
                          attachments: [],
                          webSearch: Boolean(item.webSearch),
                          deepThinking: false,
                          generateImage: Boolean(item.generateImage),
                        })
                      }
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-all duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 group-hover:text-emerald-500 transition-colors">
                        <Icon size={14} />
                        <span>{item.category}</span>
                      </div>
                      <p className="text-xs md:text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="space-y-6 pb-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isSpeaking = speakingId === msg.id;
                const feedback = likedMap[msg.id];
                const isThinkingExpanded = expandedThinking[msg.id];

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                        <Sparkles size={16} />
                      </div>
                    )}

                    {/* Message Bubble & Content Container */}
                    <div className={`max-w-[88%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* Attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 justify-end">
                          {msg.attachments.map((att, aIdx) => (
                            <div
                              key={aIdx}
                              className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 max-w-[200px]"
                            >
                              {att.previewUrl ? (
                                <img
                                  src={att.previewUrl}
                                  alt={att.name}
                                  onClick={() => onViewImage(att.previewUrl!, att.name)}
                                  className="w-auto h-28 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              ) : (
                                <div className="p-2 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono truncate">
                                  📄 {att.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* User Bubble */}
                      {isUser ? (
                        <div className="px-4 py-2.5 rounded-3xl bg-[#f4f4f4] dark:bg-[#2f2f2f] text-neutral-900 dark:text-neutral-100 text-sm md:text-base leading-relaxed break-words shadow-xs">
                          {msg.content}
                        </div>
                      ) : (
                        /* Assistant Bubble */
                        <div className="space-y-3">
                          {/* Deep Thinking accordion if active */}
                          {msg.deepThinking && (
                            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 overflow-hidden text-xs text-neutral-600 dark:text-neutral-300">
                              <button
                                onClick={() => toggleThinking(msg.id)}
                                className="w-full flex items-center justify-between px-3 py-2 font-medium hover:bg-neutral-200/50 dark:hover:bg-neutral-800 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Brain size={14} className="text-purple-500 animate-pulse" />
                                  <span>
                                    {msg.isGenerating
                                      ? 'Pensando profundamente...'
                                      : 'Raciocínio concluído com sucesso'}
                                  </span>
                                </div>
                                {isThinkingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>

                              {isThinkingExpanded && (
                                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700/60 text-xs italic text-neutral-500 dark:text-neutral-400 leading-relaxed font-mono">
                                  Análise de múltiplos ângulos, verificação de coerência e síntese estruturada da resposta para fornecer a melhor solução.
                                </div>
                              )}
                            </div>
                          )}

                          {/* Generated Image Card */}
                          {msg.imageUrl && (
                            <div className="my-3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shadow-md group relative max-w-lg">
                              <img
                                src={msg.imageUrl}
                                alt={msg.imagePrompt || 'Imagem gerada pela Ask IA'}
                                className="w-full h-auto object-cover max-h-96 rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                                <span className="text-xs text-white truncate max-w-xs font-medium">
                                  {msg.imagePrompt}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onViewImage(msg.imageUrl!, msg.imagePrompt)}
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs"
                                    title="Visualizar tela cheia"
                                  >
                                    <Maximize2 size={16} />
                                  </button>
                                  <a
                                    href={msg.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download="ask_ia_image.png"
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs"
                                    title="Download"
                                  >
                                    <Download size={16} />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Markdown Text Response */}
                          <MarkdownRenderer
                            content={msg.content}
                            isStreaming={msg.isGenerating}
                          />

                          {/* Web Grounding Sources Badges */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="pt-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                                <Globe size={13} className="text-blue-500" />
                                <span>Fontes consultadas na Web ({msg.sources.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.sources.map((src, sIdx) => {
                                  let hostname = '';
                                  try {
                                    hostname = new URL(src.url).hostname.replace('www.', '');
                                  } catch {
                                    hostname = 'web';
                                  }
                                  return (
                                    <a
                                      key={sIdx}
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60 transition-colors shadow-2xs group"
                                    >
                                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {hostname}
                                      </span>
                                      <span className="truncate max-w-[150px] text-neutral-500 dark:text-neutral-400">
                                        {src.title}
                                      </span>
                                      <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Error Banner */}
                          {msg.error && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400">
                              {msg.error}
                            </div>
                          )}

                          {/* Assistant Action Bar */}
                          {!msg.isGenerating && (
                            <div className="flex items-center gap-1 pt-1 text-neutral-400">
                              {/* Copy */}
                              <button
                                onClick={() => handleCopy(msg.content, msg.id)}
                                className="p-1.5 rounded-lg hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="Copiar resposta"
                              >
                                {copiedId === msg.id ? (
                                  <Check size={15} className="text-emerald-500" />
                                ) : (
                                  <Copy size={15} />
                                )}
                              </button>

                              {/* Read Aloud TTS */}
                              <button
                                onClick={() => handleToggleSpeak(msg.content, msg.id)}
                                className={`p-1.5 rounded-lg hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                                  isSpeaking ? 'text-emerald-500' : ''
                                }`}
                                title={isSpeaking ? 'Parar leitura' : 'Ouvir resposta em voz alta'}
                              >
                                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                              </button>

                              {/* Regenerate */}
                              <button
                                onClick={onRegenerate}
                                className="p-1.5 rounded-lg hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="Regenerar resposta"
                              >
                                <RotateCcw size={15} />
                              </button>

                              {/* Thumbs up */}
                              <button
                                onClick={() => handleFeedback(msg.id, 'up')}
                                className={`p-1.5 rounded-lg hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                                  feedback === 'up' ? 'text-emerald-500' : ''
                                }`}
                                title="Boa resposta"
                              >
                                <ThumbsUp size={15} />
                              </button>

                              {/* Thumbs down */}
                              <button
                                onClick={() => handleFeedback(msg.id, 'down')}
                                className={`p-1.5 rounded-lg hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                                  feedback === 'down' ? 'text-red-500' : ''
                                }`}
                                title="Resposta ruim"
                              >
                                <ThumbsDown size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-8 p-2.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shadow-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all z-20 cursor-pointer animate-in fade-in"
          title="Rolar para o final"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Bottom Input Area */}
      <ChatInput
        onSendMessage={onSendMessage}
        onStopGenerating={onStopGenerating}
        isGenerating={isGenerating}
      />
    </div>
  );
};
