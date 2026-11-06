import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse text into tokens/blocks
  const renderBlocks = () => {
    if (!content) return null;

    // Split by code blocks first
    const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let blockCounter = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(
          <div key={`text-${blockCounter++}`} className="space-y-3">
            {renderStandardMarkdown(textBefore)}
          </div>
        );
      }

      const language = match[1] || 'código';
      const code = match[2].trimEnd();
      const currentIndex = blockCounter++;

      parts.push(
        <div
          key={`code-${currentIndex}`}
          className="my-4 rounded-xl overflow-hidden border border-neutral-700/60 bg-neutral-900 text-neutral-100 shadow-md"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-neutral-800/90 border-b border-neutral-700/60 text-xs text-neutral-300 font-mono">
            <span className="uppercase tracking-wider font-semibold text-neutral-400">
              {language}
            </span>
            <button
              onClick={() => copyToClipboard(code, currentIndex)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer text-xs"
              title="Copiar código"
            >
              {copiedIndex === currentIndex ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar código</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-[#141414]">
            <pre className="m-0 text-neutral-200">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last code block
    const remainingText = content.substring(lastIndex);
    if (remainingText) {
      parts.push(
        <div key={`text-${blockCounter++}`} className="space-y-3">
          {renderStandardMarkdown(remainingText)}
        </div>
      );
    }

    return parts;
  };

  // Helper for inline styles (bold, italic, inline code, links)
  const formatInline = (text: string): React.ReactNode => {
    // Regex for inline code: `code`
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-xs bg-neutral-200/70 dark:bg-neutral-800 text-pink-600 dark:text-pink-400 border border-neutral-300/40 dark:border-neutral-700/50"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Format bold and links inside non-code
      let renderedText: React.ReactNode[] = [];
      const linkRegex = /\[(.*?)\]\((.*?)\)/g;
      let lastLinkIdx = 0;
      let linkMatch: RegExpExecArray | null;

      while ((linkMatch = linkRegex.exec(part)) !== null) {
        const pre = part.substring(lastLinkIdx, linkMatch.index);
        if (pre) renderedText.push(renderBoldAndItalics(pre, `${i}-${lastLinkIdx}`));
        
        renderedText.push(
          <a
            key={`link-${i}-${linkMatch.index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/40 hover:decoration-emerald-500 inline-flex items-center gap-0.5"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink size={12} className="inline opacity-70" />
          </a>
        );
        lastLinkIdx = linkMatch.index + linkMatch[0].length;
      }

      const post = part.substring(lastLinkIdx);
      if (post) renderedText.push(renderBoldAndItalics(post, `${i}-end`));

      return <React.Fragment key={i}>{renderedText}</React.Fragment>;
    });
  };

  const renderBoldAndItalics = (str: string, keyPrefix: string): React.ReactNode => {
    const boldParts = str.split(/(\*\*.*?\*\*|__.*?__)/g);

    return boldParts.map((bPart, idx) => {
      if ((bPart.startsWith('**') && bPart.endsWith('**')) || (bPart.startsWith('__') && bPart.endsWith('__'))) {
        return (
          <strong key={`${keyPrefix}-${idx}`} className="font-semibold text-neutral-900 dark:text-neutral-50">
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return bPart;
    });
  };

  // Render paragraphs, headers, tables, lists
  const renderStandardMarkdown = (raw: string): React.ReactNode[] => {
    const lines = raw.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        nodes.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-4 mb-2 tracking-tight">
            {formatInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        nodes.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-4 mb-2 tracking-tight">
            {formatInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        nodes.push(
          <h3 key={`h3-${i}`} className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-3 mb-1.5">
            {formatInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }

      // Horizontal rule
      if (line.trim() === '---' || line.trim() === '***') {
        nodes.push(
          <hr key={`hr-${i}`} className="my-4 border-neutral-200 dark:border-neutral-800" />
        );
        i++;
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
          quoteLines.push(lines[i].slice(2));
          i++;
        }
        nodes.push(
          <blockquote
            key={`quote-${i}`}
            className="border-l-4 border-emerald-500/70 pl-4 py-1 my-2 italic text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/40 rounded-r-md"
          >
            {quoteLines.map((ql, qIdx) => (
              <p key={qIdx}>{formatInline(ql)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Tables (detecting | col | col |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0]
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          const rows = tableLines.slice(2).map((r) =>
            r
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim())
          );

          nodes.push(
            <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700/60 shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 uppercase text-xs font-semibold">
                  <tr>
                    {headerRow.map((cell, cIdx) => (
                      <th key={cIdx} className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                        {formatInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700/50">
                  {rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-neutral-50/50 dark:bg-neutral-800/30'}
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Bullet lists
      if (line.match(/^[\*\-]\s+/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^[\*\-]\s+/)) {
          listItems.push(lines[i].replace(/^[\*\-]\s+/, ''));
          i++;
        }
        nodes.push(
          <ul key={`ul-${i}`} className="list-disc pl-6 space-y-1 my-2 text-neutral-800 dark:text-neutral-200">
            {listItems.map((item, lIdx) => (
              <li key={lIdx} className="leading-relaxed">
                {formatInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered lists
      if (line.match(/^\d+\.\s+/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
          listItems.push(lines[i].replace(/^\d+\.\s+/, ''));
          i++;
        }
        nodes.push(
          <ol key={`ol-${i}`} className="list-decimal pl-6 space-y-1 my-2 text-neutral-800 dark:text-neutral-200">
            {listItems.map((item, lIdx) => (
              <li key={lIdx} className="leading-relaxed">
                {formatInline(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Regular paragraph
      nodes.push(
        <p key={`p-${i}`} className="leading-relaxed text-neutral-800 dark:text-neutral-200 my-1.5">
          {formatInline(line)}
        </p>
      );
      i++;
    }

    return nodes;
  };

  return (
    <div className="markdown-body leading-relaxed text-base break-words">
      {renderBlocks()}
      {isStreaming && <span className="cursor-blink" />}
    </div>
  );
};
