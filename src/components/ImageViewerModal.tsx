import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrl: string | null;
  prompt?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  imageUrl,
  prompt,
  onClose,
}) => {
  if (!imageUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ask_ia_image_${Date.now()}.png`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/80 border-b border-neutral-700/60 text-white">
          <span className="text-sm font-semibold truncate max-w-md">
            {prompt || 'Visualização da Imagem - Ask IA'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Baixar imagem"
            >
              <Download size={18} />
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image content */}
        <div className="flex items-center justify-center bg-black/40 p-4 max-h-[75vh] overflow-auto">
          <img
            src={imageUrl}
            alt={prompt || 'Imagem gerada pela Ask IA'}
            className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
          />
        </div>

        {prompt && (
          <div className="px-4 py-3 bg-neutral-800/50 border-t border-neutral-700/60 text-xs text-neutral-300">
            <span className="font-semibold text-neutral-400 mr-2">Prompt visual:</span>
            {prompt}
          </div>
        )}
      </div>
    </div>
  );
};
