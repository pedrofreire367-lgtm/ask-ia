import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Check } from 'lucide-react';

interface ModelSelectorProps {
  currentModel: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
  onSelectModel: (model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite') => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onSelectModel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const models = [
    {
      id: 'gemini-3.8-flash' as const,
      name: 'Ask IA 4.0',
      tag: 'Mais Inteligente',
      description: 'Nosso modelo principal. Raciocínio avançado, código, pesquisa web e visão em alta velocidade.',
      icon: Sparkles,
      iconColor: 'text-emerald-500',
    },
    {
      id: 'gemini-3.1-flash-lite' as const,
      name: 'Ask IA Mini',
      tag: 'Ultrarrápido',
      description: 'Respostas quase instantâneas para tarefas leves, resumos e conversas ágeis.',
      icon: Zap,
      iconColor: 'text-amber-500',
    },
  ];

  const activeModel = models.find((m) => m.id === currentModel) || models[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-lg transition-colors cursor-pointer"
      >
        <span>{activeModel.name}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="text-xs font-semibold px-3 py-1.5 text-neutral-400 uppercase tracking-wider">
            Modelos Disponíveis
          </div>
          <div className="space-y-1 mt-1">
            {models.map((model) => {
              const Icon = model.icon;
              const isSelected = model.id === currentModel;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-900 dark:text-neutral-100'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 ${model.iconColor}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{model.name}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {model.tag}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="mt-1 text-emerald-500">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
