export interface Attachment {
  name: string;
  mimeType: string;
  base64: string;
  previewUrl?: string;
  size?: number;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isGenerating?: boolean;
  deepThinking?: boolean;
  thinkingDuration?: number;
  webSearch?: boolean;
  sources?: GroundingSource[];
  imageUrl?: string;
  imagePrompt?: string;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  messages: Message[];
  model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  customInstructions: string;
  userBio: string;
  model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
  soundEnabled: boolean;
  autoSpeak: boolean;
  speechRate: number;
  userName: string;
  userEmail: string;
}
