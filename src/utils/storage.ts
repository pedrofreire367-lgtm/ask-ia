import { Conversation, UserSettings } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'ask_ia_conversations',
  CURRENT_CONVERSATION_ID: 'ask_ia_current_id',
  SETTINGS: 'ask_ia_settings',
};

export const defaultSettings: UserSettings = {
  theme: 'dark',
  customInstructions: '',
  userBio: '',
  model: 'gemini-3.8-flash',
  soundEnabled: true,
  autoSpeak: false,
  speechRate: 1.0,
  userName: 'Luiz Henrique',
  userEmail: 'luizhenriquesas@hotmail.com',
};

export const loadStoredSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading settings from localStorage', e);
  }
  return defaultSettings;
};

export const saveStoredSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
};

export const loadStoredConversations = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading conversations from localStorage', e);
  }
  return [];
};

export const saveStoredConversations = (conversations: Conversation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Error saving conversations to localStorage', e);
  }
};

export const loadCurrentConversationId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
  } catch (e) {
    return null;
  }
};

export const saveCurrentConversationId = (id: string | null): void => {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
    }
  } catch (e) {
    console.error('Error saving current conversation ID', e);
  }
};

export const exportConversationAsMarkdown = (conversation: Conversation): void => {
  let md = `# ${conversation.title}\n*Exportado da Ask IA em ${new Date().toLocaleString('pt-BR')}*\n\n---\n\n`;

  conversation.messages.forEach((msg) => {
    const author = msg.role === 'user' ? '👤 **Você**' : '✨ **Ask IA**';
    const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR');
    md += `### ${author} (${time})\n\n${msg.content}\n\n`;

    if (msg.imageUrl) {
      md += `![Imagem Gerada](${msg.imageUrl})\n\n`;
    }

    if (msg.sources && msg.sources.length > 0) {
      md += `**Fontes consultadas:**\n`;
      msg.sources.forEach((s) => {
        md += `- [${s.title}](${s.url})\n`;
      });
      md += '\n';
    }

    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conversation.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportAllDataAsJSON = (conversations: Conversation[], settings: UserSettings): void => {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    app: 'Ask IA',
    settings,
    conversations,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ask_ia_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
