import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '250mb' }));
  app.use(express.urlencoded({ extended: true, limit: '250mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'AI CMO Dashboard' });
  });

  // Mount API routes
  app.use('/api', apiRouter);

  // Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // In Express v4 use '*'
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP server
  const server = http.createServer(app);

  // Setup WebSocket Server for Gemini Live API
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('🎤 Client connected to Gemini Live WebSocket');
    let session: any = null;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY environment variable is missing.' }));
        clientWs.close();
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      // Connect to Gemini Live API with model gemini-3.1-flash-live-preview
      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are the AI CMO Assistant. You are an expert Chief Marketing Officer conversing in real-time about marketing strategies, campaign performance, lead pipelines, conversion rates, customer acquisition costs, and data insights. Keep your spoken responses concise, insightful, conversational, and direct.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Audio output from model
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }

            // Model output transcript
            const modelTranscript = message.serverContent?.outputTranscription?.text;
            if (modelTranscript) {
              clientWs.send(JSON.stringify({ modelTranscript }));
            }

            // User input transcript
            const userTranscript = message.serverContent?.inputTranscription?.text;
            if (userTranscript) {
              clientWs.send(JSON.stringify({ userTranscript }));
            }

            // Interrupted flag
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }

            // Turn complete flag
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
          },
          onclose: () => {
            console.log('Gemini Live session closed');
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ status: 'session_closed' }));
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: err?.message || 'Gemini Live API error' }));
            }
          }
        }
      });

      clientWs.send(JSON.stringify({ status: 'connected', message: 'Connected to Gemini Live Voice Assistant' }));

    } catch (err: any) {
      console.error('Failed to initialize Gemini Live connection:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: err?.message || 'Failed to connect to Live API' }));
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (data: any) => {
      if (!session) return;
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: 'audio/pcm;rate=16000'
            }
          });
        } else if (msg.text) {
          session.sendRealtimeInput({
            text: msg.text
          });
        }
      } catch (e) {
        console.error('Error parsing client WS message:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected from Live WebSocket');
      if (session) {
        try {
          session.close();
        } catch (e) {
          // ignore
        }
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AI CMO Dashboard Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
