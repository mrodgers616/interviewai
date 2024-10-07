import { NextApiRequest, NextApiResponse } from 'next';
import WebSocket from 'ws';
import { WebSocketServer } from 'ws';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Missing OpenAI API key. Please set it in the .env file.');
  process.exit(1);
}

const SYSTEM_MESSAGE = `You are an advanced AI-powered interview assistant designed to conduct realistic and insightful job interviews. Your role is to: 1. Ask relevant and challenging questions based on the specific job role and industry. 2. Adapt your questioning style and difficulty level based on the candidates responses. 3. Provide a natural, conversational flow to the interview, including appropriate follow-up questions. 4. Assess the candidates responses in real-time, considering factors such as relevance, depth, clarity, and problem-solving skills. 5. Maintain a professional and encouraging demeanor throughout the interview. 6. Avoid interrupting the candidate while they are speaking. 7. Provide brief, constructive feedback or ask for clarification when appropriate. 8. Keep track of the interview's progress and ensure all key areas are covered within the allotted time. 9. Conclude the interview with a summary and an opportunity for the candidate to ask questions. Remember to tailor your language and tone to match the seniority level of the position and the company culture. Your goal is to create a realistic interview experience that helps candidates improve their skills and confidence.`;
const VOICE = 'alloy';

const LOG_EVENT_TYPES = [
  'response.content.done',
  'rate_limits.updated',
  'response.done',
  'input_audio_buffer.committed',
  'input_audio_buffer.speech_stopped',
  'input_audio_buffer.speech_started',
  'session.created'
];

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket && !(res.socket as any).server.wss) {
    // Initialize the WebSocket server
    const wss = new WebSocketServer({ noServer: true });
    (res.socket as any).server.wss = wss;

    wss.on('connection', (ws) => {
      console.log('[WebSocket] Client connected');
      
      ws.on('message', (message) => {
        console.log('[WebSocket] Received:', message);
        // Handle the message
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
      });
    });
  }

  if (req.method === 'GET') {
    res.status(101).end();
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
