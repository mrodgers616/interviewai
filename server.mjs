import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Missing OpenAI API key. Please set it in the .env file.');
  process.exit(1);
}

const SYSTEM_MESSAGE = `You are an advanced AI-powered interview assistant designed to conduct realistic and insightful job interviews. Your role is to: 1. Ask relevant and challenging questions based on the specific job role and industry. 2. Adapt your questioning style and difficulty level based on the candidates responses. 3. Provide a natural, conversational flow to the interview, including appropriate follow-up questions. 4. Assess the candidates responses in real-time, considering factors such as relevance, depth, clarity, and problem-solving skills. 5. Maintain a professional and encouraging demeanor throughout the interview. 6. Avoid interrupting the candidate while they are speaking. 7. Provide brief, constructive feedback or ask for clarification when appropriate. 8. Keep track of the interview's progress and ensure all key areas are covered within the allotted time. 9. Conclude the interview with a summary and an opportunity for the candidate to ask questions. Remember to tailor your language and tone to match the seniority level of the position and the company culture. Your goal is to create a realistic interview experience that helps candidates improve their skills and confidence.`;
const VOICE = 'alloy';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({
    noServer: true,
    verifyClient: (info, callback) => {
      const allowedOrigins = [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'https://03a9-2601-c2-1b81-4e0-58ce-e8c0-5e7c-9b9.ngrok-free.app',
        'https://interviewai-five.vercel.app' // Add your deployed app's domain here
      ];
      if (allowedOrigins.includes(info.origin) || info.origin.endsWith('.vercel.app')) {
        callback(true);
      } else {
        callback(false, 403, 'Forbidden');
      }
    }
  });

  server.on('upgrade', (request, socket, head) => {
    const pathname = parse(request.url).pathname;

    if (pathname === '/api/realtime-api') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request) => {
    console.log('[WebSocket] New client connected');

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    openAiWs.on('open', () => {
      console.log('[OpenAI] Connected to the OpenAI Realtime API');
      // Send session update with initial configuration
      const sessionUpdate = {
        type: 'session.update',
        session: {
          turn_detection: { type: 'server_vad' },
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          voice: VOICE,
          instructions: SYSTEM_MESSAGE,
          modalities: ["text", "audio"],
          temperature: 0.8,
        }
      };
      openAiWs.send(JSON.stringify(sessionUpdate));
    });

    openAiWs.on('message', (data) => {
      console.log('[OpenAI] Received message from OpenAI');
      try {
        const response = JSON.parse(data.toString());
        console.log(`[OpenAI] Received event: ${response.type}`, response);

        if (response.type === 'response.audio.delta' && response.delta) {
          ws.send(JSON.stringify({
            type: 'audio',
            data: response.delta
          }));
        } else if (response.type === 'response.text.delta' && response.delta) {
          ws.send(JSON.stringify({
            type: 'text',
            data: response.delta.text
          }));
        }
      } catch (error) {
        console.error('[OpenAI] Error processing OpenAI message:', error);
      }
    });

    ws.on('message', (message) => {
      console.log('[WebSocket] Received message from client');
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'audio' && openAiWs.readyState === WebSocket.OPEN) {
          const audioAppend = {
            type: 'input_audio_buffer.append',
            audio: data.data // This is already base64 encoded
          };
          openAiWs.send(JSON.stringify(audioAppend));
        } else if (data.type === 'text' && openAiWs.readyState === WebSocket.OPEN) {
          const textMessage = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{
                type: 'input_text',
                text: data.data
              }]
            }
          };
          openAiWs.send(JSON.stringify(textMessage));
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      if (openAiWs.readyState === WebSocket.OPEN) {
        openAiWs.close();
      }
    });

    openAiWs.on('close', () => {
      console.log('[OpenAI] Disconnected from the OpenAI Realtime API');
    });

    openAiWs.on('error', (error) => {
      console.error('[OpenAI] Error in the OpenAI WebSocket:', error);
    });
  });

  wss.on('error', (error) => {
    console.error('[WebSocketServer] Error:', error);
  });

  const port = process.env.PORT || 3001;

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});