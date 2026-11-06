import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Array<{
    name: string;
    mimeType: string;
    base64: string;
  }>;
}

// 1. Health & status check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Ask IA Server',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Chat Title generator endpoint (concise 3-5 words)
app.post('/api/chat/title', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.json({ title: 'Nova conversa' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Gere um título extremamente conciso (máximo 4 a 5 palavras), limpo e direto em português para uma conversa que inicia com a seguinte mensagem do usuário. Não use aspas, nem pontuação final, nem emojis, apenas o título puro:\n\nMensagem: "${prompt}"`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const title = response.text?.trim().replace(/^["']|["']$/g, '') || 'Conversa';
    res.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    res.json({ title: 'Nova conversa' });
  }
});

// 3. Main Chat Streaming Endpoint (SSE)
app.post('/api/chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      messages,
      model = 'gemini-3.8-flash',
      webSearch = false,
      deepThinking = false,
      customInstructions = '',
      userProfile = '',
      temperature,
    } = req.body as {
      messages: IncomingMessage[];
      model?: string;
      webSearch?: boolean;
      deepThinking?: boolean;
      customInstructions?: string;
      userProfile?: string;
      temperature?: number;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      sendEvent('error', { message: 'Nenhuma mensagem fornecida.' });
      res.end();
      return;
    }

    // Build system instruction
    const baseSystemInstruction = [
      'Você é a Ask IA, uma inteligência artificial conversacional avançada, elegante e altamente capacitada, desenhada no mesmo padrão de excelência, clareza e inteligência do ChatGPT.',
      'Suas principais características:',
      '- Responda sempre com clareza, empatia, precisão técnica e linguagem fluida, natural e inteligente.',
      '- Você é perfeitamente fluente em português brasileiro (e adapta-se instantaneamente a qualquer outro idioma solicitado pelo usuário).',
      '- Formate suas respostas de maneira impecável usando Markdown rico: utilize negrito para destaques, listas organizadas, tabelas quando apropriado, e blocos de código com a identificação correta da linguagem de programação.',
      '- Se o usuário solicitar código, forneça código moderno, limpo, bem documentado e pronto para produção.',
      '- Seja útil, pró-ativo e forneça explicações passo a passo quando o problema exigir.',
      '- Mantenha o tom profissional, acolhedor e objetivo, sem prolixidade desnecessária.',
    ];

    if (userProfile && userProfile.trim()) {
      baseSystemInstruction.push(`\nInformações sobre o usuário para levar em consideração:\n${userProfile.trim()}`);
    }

    if (customInstructions && customInstructions.trim()) {
      baseSystemInstruction.push(`\nInstruções personalizadas fornecidas pelo usuário:\n${customInstructions.trim()}`);
    }

    // Format conversation history for Gemini API
    const formattedContents: Array<{ role: 'user' | 'model'; parts: MessagePart[] }> = [];

    for (const msg of messages) {
      const parts: MessagePart[] = [];

      // Add attachments if present (images/documents)
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          if (att.base64 && att.mimeType) {
            // Clean base64 data URL prefix if included
            const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        formattedContents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
    }

    // Choose target model (fallback safely to gemini-3.8-flash)
    const selectedModel = model === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

    // Build configuration
    const config: any = {
      systemInstruction: baseSystemInstruction.join('\n'),
    };

    // Thinking config
    if (deepThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    // Web Search tool
    if (webSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Call streaming API
    const stream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: formattedContents,
      config,
    });

    let fullText = '';
    let extractedGrounding: any[] = [];

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        sendEvent('chunk', { text });
      }

      // Check for grounding metadata in candidates
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && Array.isArray(groundingChunks) && groundingChunks.length > 0) {
        for (const gc of groundingChunks) {
          if (gc.web?.uri) {
            extractedGrounding.push({
              title: gc.web.title || gc.web.uri,
              url: gc.web.uri,
            });
          }
        }
      }
    }

    // Deduplicate grounding sources
    if (extractedGrounding.length > 0) {
      const uniqueSources = Array.from(
        new Map(extractedGrounding.map((item) => [item.url, item])).values()
      );
      sendEvent('grounding', { sources: uniqueSources });
    }

    sendEvent('done', { fullLength: fullText.length });
    res.end();
  } catch (error: any) {
    console.error('Error in chat stream:', error);
    sendEvent('error', {
      message: error.message || 'Ocorreu um erro ao processar sua mensagem.',
    });
    res.end();
  }
});

// 4. Image Generation endpoint
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    // Generate prompt expansion and prompt interpretation
    const refinedPromptResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `O usuário quer gerar uma imagem com o pedido: "${prompt}".
Elabore uma descrição visual rica em inglês para um gerador de imagem, detalhada, artística, de alta qualidade.
Responda APENAS com a descrição visual concisa em inglês, sem introdução nem explicações.`,
    });

    const refinedPrompt = refinedPromptResponse.text?.trim() || prompt;
    // URL-encoded prompt for high quality rendering
    const encodedPrompt = encodeURIComponent(refinedPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

    res.json({
      success: true,
      imageUrl,
      prompt: refinedPrompt,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message || 'Falha ao gerar imagem' });
  }
});

// Setup Vite or production static handler
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Ask IA] Servidor rodando na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
