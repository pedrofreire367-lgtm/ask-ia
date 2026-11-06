import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Globe,
  Brain,
  Palette,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Mic,
  MicOff,
  X,
} from 'lucide-react';
import { Attachment } from '../types';
import { isSpeechRecognitionSupported } from '../utils/audio';

interface ChatInputProps {
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
  isGenerating: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGenerating,
  isGenerating,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [webSearch, setWebSearch] = useState(false);
  const [deepThinking, setDeepThinking] = useState(false);
  const [generateImage, setGenerateImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [text]);

  // Handle click outside attachment menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Voice speech-to-text
  const toggleRecording = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Seu navegador não suporta reconhecimento de voz direto. Tente no Google Chrome ou Edge.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setText((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      if (isImage || file.type.startsWith('image/')) {
        reader.onload = () => {
          const base64 = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type || 'image/png',
              base64,
              previewUrl: base64,
              size: file.size,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Document / Code / Text file
        reader.onload = () => {
          const content = reader.result as string;
          // encode to base64
          const base64 = btoa(unescape(encodeURIComponent(content)));
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: 'text/plain',
              base64: `data:text/plain;base64,${base64}`,
              previewUrl: undefined,
              size: file.size,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    e.target.value = '';
    setShowAttachMenu(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isGenerating) return;

    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage(trimmed, {
      attachments,
      webSearch,
      deepThinking,
      generateImage,
    });

    setText('');
    setAttachments([]);
    // Reset image generation toggle after sending
    if (generateImage) setGenerateImage(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileUpload(e, true)}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, false)}
        accept=".txt,.md,.json,.js,.ts,.tsx,.py,.html,.css,.csv"
        multiple
        className="hidden"
      />

      {/* Main input wrapper */}
      <div className="relative rounded-3xl bg-neutral-100 dark:bg-[#2f2f2f] border border-neutral-300/80 dark:border-neutral-700/70 shadow-lg focus-within:ring-2 focus-within:ring-neutral-400 dark:focus-within:ring-neutral-600 focus-within:border-transparent transition-all">
        {/* Attachment preview strip */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs shadow-xs group"
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <FileText size={15} />
                  </div>
                )}
                <div className="max-w-[120px] truncate">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">{att.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              generateImage
                ? 'Descreva a imagem que você deseja criar com a Ask IA...'
                : 'Envie uma mensagem para a Ask IA...'
            }
            rows={1}
            disabled={disabled}
            className="w-full max-h-48 resize-none bg-transparent text-sm md:text-base text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Bottom controls bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left tools: Attachment (+) and mode pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Attachment dropdown */}
            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
                title="Adicionar arquivo ou imagem"
              >
                <Paperclip size={18} />
              </button>

              {showAttachMenu && (
                <div className="absolute left-0 bottom-11 w-48 rounded-2xl bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                  >
                    <ImageIcon size={16} className="text-emerald-500" />
                    <div>
                      <span className="font-semibold block">Foto ou Imagem</span>
                      <span className="text-[10px] text-neutral-400">Visão computacional</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                  >
                    <FileText size={16} className="text-blue-500" />
                    <div>
                      <span className="font-semibold block">Documento / Código</span>
                      <span className="text-[10px] text-neutral-400">TXT, MD, JS, PY, JSON</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Web Search toggle chip */}
            <button
              type="button"
              onClick={() => setWebSearch(!webSearch)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                webSearch
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50 border border-neutral-300/60 dark:border-neutral-700'
              }`}
              title="Pesquisar na Web com dados recentes"
            >
              <Globe size={13} className={webSearch ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
              <span>Pesquisa Web</span>
            </button>

            {/* Deep Thinking toggle chip */}
            <button
              type="button"
              onClick={() => setDeepThinking(!deepThinking)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                deepThinking
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50 border border-neutral-300/60 dark:border-neutral-700'
              }`}
              title="Raciocínio Profundo para problemas complexos"
            >
              <Brain size={13} />
              <span>Raciocínio</span>
            </button>

            {/* Image generation toggle chip */}
            <button
              type="button"
              onClick={() => setGenerateImage(!generateImage)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                generateImage
                  ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50 border border-neutral-300/60 dark:border-neutral-700'
              }`}
              title="Gerar imagem a partir do texto"
            >
              <Palette size={13} />
              <span>Criar Imagem</span>
            </button>
          </div>

          {/* Right controls: Mic & Send / Stop */}
          <div className="flex items-center gap-2">
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/60'
              }`}
              title={isRecording ? 'Parar gravação' : 'Falar por voz'}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Send or Stop */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGenerating}
                className="p-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-transform active:scale-95 shadow-md cursor-pointer"
                title="Parar geração"
              >
                <Square size={16} className="fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!hasContent || disabled}
                className={`p-2 rounded-full transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${
                  hasContent && !disabled
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'
                    : 'bg-neutral-300/70 dark:bg-neutral-700/60 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                }`}
                title="Enviar mensagem"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Voice recording waveform banner if listening */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-red-500 dark:text-red-400 font-medium animate-pulse">
          <div className="flex items-center gap-0.5 h-4">
            <span className="w-1 bg-red-500 rounded-full animate-wave-1" />
            <span className="w-1 bg-red-500 rounded-full animate-wave-2" />
            <span className="w-1 bg-red-500 rounded-full animate-wave-3" />
            <span className="w-1 bg-red-500 rounded-full animate-wave-4" />
            <span className="w-1 bg-red-500 rounded-full animate-wave-5" />
          </div>
          <span>Ouvindo sua voz... fale livremente</span>
        </div>
      )}

      {/* Disclaimer footer */}
      <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
        A Ask IA pode cometer erros. Considere verificar informações importantes.
      </p>
    </div>
  );
};
