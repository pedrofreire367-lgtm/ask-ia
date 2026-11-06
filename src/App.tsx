/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Conversation, Message, UserSettings, Attachment } from './types';
import {
  loadStoredConversations,
  saveStoredConversations,
  loadCurrentConversationId,
  saveCurrentConversationId,
  loadStoredSettings,
  saveStoredSettings,
} from './utils/storage';
import { SpeechHandler } from './utils/audio';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { ImageViewerModal } from './components/ImageViewerModal';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadStoredConversations());
  const [currentId, setCurrentId] = useState<string | null>(() => loadCurrentConversationId());
  const [settings, setSettings] = useState<UserSettings>(() => loadStoredSettings());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; prompt?: string } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', settings.theme === 'dark');
    }
  }, [settings.theme]);

  // Save conversations to localStorage on change
  useEffect(() => {
    saveStoredConversations(conversations);
  }, [conversations]);

  // Save current conversation ID to localStorage
  useEffect(() => {
    saveCurrentConversationId(currentId);
  }, [currentId]);

  // Save settings on update
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Keyboard shortcut Ctrl+K / Cmd+K for new conversation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewConversation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Responsive sidebar collapse on small screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Play gentle subtle notification chime using Web Audio API
  const playChime = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext may be restricted before user gesture
    }
  }, [settings.soundEnabled]);

  // Current active conversation
  const currentConversation = conversations.find((c) => c.id === currentId) || null;

  // Create new conversation
  const handleNewConversation = () => {
    SpeechHandler.stop();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCurrentId(null);
  };

  const handleSelectConversation = (id: string) => {
    SpeechHandler.stop();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCurrentId(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentId === id) {
      setCurrentId(null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleTogglePinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleClearAllConversations = () => {
    setConversations([]);
    setCurrentId(null);
  };

  const handleSelectModel = (model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite') => {
    setSettings((prev) => ({ ...prev, model }));
    if (currentId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === currentId ? { ...c, model } : c))
      );
    }
  };

  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // Stop generation if running
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => (m.isGenerating ? { ...m, isGenerating: false } : m)),
        };
      })
    );
  };

  // Send message
  const handleSendMessage = async (
    text: string,
    options: {
      attachments: Attachment[];
      webSearch: boolean;
      deepThinking: boolean;
      generateImage: boolean;
    }
  ) => {
    SpeechHandler.stop();

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: options.attachments,
    };

    let targetConvId = currentId;
    let isNewChat = false;

    // If no conversation currently selected, create one
    if (!targetConvId) {
      targetConvId = `conv-${Date.now()}`;
      isNewChat = true;

      const newConv: Conversation = {
        id: targetConvId,
        title: text ? text.slice(0, 30) : 'Nova conversa',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage],
        model: settings.model,
      };

      setConversations((prev) => [newConv, ...prev]);
      setCurrentId(targetConvId);

      // Async title generation in Portuguese
      if (text) {
        fetch('/api/chat/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.title) {
              handleRenameConversation(targetConvId!, data.title);
            }
          })
          .catch(() => {});
      }
    } else {
      // Append user message to active conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...c.messages, userMessage],
              }
            : c
        )
      );
    }

    const assistantMsgId = `asst-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isGenerating: true,
      deepThinking: options.deepThinking,
      webSearch: options.webSearch,
    };

    // Add empty assistant placeholder message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: [...c.messages, assistantMessage],
            }
          : c
      )
    );

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 1. If Image Generation is requested
    if (options.generateImage) {
      try {
        const res = await fetch('/api/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
          signal: controller.signal,
        });

        const data = await res.json();
        if (data.success && data.imageUrl) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== targetConvId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `Aqui está a imagem criada com base no seu pedido: **${text}**`,
                        imageUrl: data.imageUrl,
                        imagePrompt: data.prompt,
                        isGenerating: false,
                      }
                    : m
                ),
              };
            })
          );
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
          playChime();
        } else {
          throw new Error(data.error || 'Não foi possível gerar a imagem.');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: 'Desculpe, ocorreu um erro ao gerar a imagem.',
                      error: err.message,
                      isGenerating: false,
                    }
                  : m
              ),
            };
          })
        );
      } finally {
        abortControllerRef.current = null;
      }
      return;
    }

    // 2. Regular / Multimodal / Web Search Chat Stream
    try {
      // Find history of conversation
      const currentConv = conversations.find((c) => c.id === targetConvId);
      const previousMessages = currentConv ? currentConv.messages : [];
      const allMessages = [...previousMessages, userMessage];

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments?.map((a) => ({
              name: a.name,
              mimeType: a.mimeType,
              base64: a.base64,
            })),
          })),
          model: currentConv?.model || settings.model,
          webSearch: options.webSearch,
          deepThinking: options.deepThinking,
          customInstructions: settings.customInstructions,
          userProfile: settings.userBio,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Falha no servidor: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Não foi possível ler a transmissão de dados.');

      const decoder = new TextDecoder();
      let streamedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;

          let event = 'chunk';
          let dataStr = '';

          const eventMatch = block.match(/^event:\s*(\w+)/m);
          if (eventMatch) event = eventMatch[1];

          const dataMatch = block.match(/^data:\s*(.+)$/m);
          if (dataMatch) dataStr = dataMatch[1];

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (event === 'chunk' && parsed.text) {
              streamedContent += parsed.text;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== targetConvId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: streamedContent } : m
                    ),
                  };
                })
              );
            } else if (event === 'grounding' && parsed.sources) {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== targetConvId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, sources: parsed.sources } : m
                    ),
                  };
                })
              );
            } else if (event === 'error') {
              throw new Error(parsed.message || 'Erro durante a geração');
            }
          } catch (e: any) {
            console.error('SSE JSON parse error:', e);
          }
        }
      }

      // Generation complete
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConvId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, isGenerating: false } : m
            ),
          };
        })
      );

      playChime();

      if (settings.autoSpeak && streamedContent) {
        SpeechHandler.speak(streamedContent, { rate: settings.speechRate });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Handled cleanly
        return;
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConvId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: m.content || 'Não foi possível completar a resposta.',
                    error: err.message,
                    isGenerating: false,
                  }
                : m
            ),
          };
        })
      );
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return;
    const msgs = currentConversation.messages;
    const lastUserIndex = [...msgs].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualUserIndex = msgs.length - 1 - lastUserIndex;
    const userMsg = msgs[actualUserIndex];

    // Remove everything after this user message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== currentId) return c;
        return {
          ...c,
          messages: c.messages.slice(0, actualUserIndex),
        };
      })
    );

    // Resend
    handleSendMessage(userMsg.content, {
      attachments: userMsg.attachments || [],
      webSearch: false,
      deepThinking: false,
      generateImage: false,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#212121] text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        settings={settings}
      />

      {/* Main Chat Area */}
      <ChatArea
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        onStopGenerating={handleStopGenerating}
        onRegenerate={handleRegenerate}
        onSelectModel={handleSelectModel}
        onNewConversation={handleNewConversation}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        settings={settings}
        onToggleTheme={handleToggleTheme}
        onViewImage={(url, prompt) => setViewingImage({ url, prompt })}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(newSettings)}
        conversations={conversations}
        onClearAllConversations={handleClearAllConversations}
      />

      {/* Fullscreen Image Preview Modal */}
      <ImageViewerModal
        imageUrl={viewingImage?.url || null}
        prompt={viewingImage?.prompt}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
}
