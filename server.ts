import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with required User-Agent
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Route: Multi-turn Chat with Back Bay Satellite Office using Gemini 3.5 Flash & Google Maps Grounding
app.post('/api/backbay/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array.' });
    }

    // Format conversation history for Gemini API
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (aiClient && process.env.GEMINI_API_KEY) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: formattedContents,
          config: {
            systemInstruction: `You are the Senior Snow Operations Coordinator and Dispatch Liaison stationed at the SnowOps Satellite Command Office in Back Bay, Boston (Boylston St & Dartmouth St near Copley Square).
Your mission is to support the main SnowOps Everett Command with real-time neighborhood updates, city parking emergency rules, snow emergency arterial routes, salt staging, and hospital accessibility (MGH, Tufts Medical, Boston Medical).
You utilize Google Maps grounding for accurate Boston geography, traffic snarls, staging alleys, and route clearances.
Tone: Highly professional, calm under pressure, tactical, concise, and focused on crew safety and efficient snow removal.`,
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: 42.3503, // Back Bay, Boston
                  longitude: -71.0810,
                },
              },
            },
          },
        });

        const replyText = response.text || 'Copy that, dispatch. Standing by on Back Bay channel.';

        // Extract Google Maps and Web grounding links
        const groundingLinks: Array<{ title: string; uri: string }> = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of chunks as any[]) {
          if (chunk.maps?.uri) {
            groundingLinks.push({
              title: chunk.maps.title || 'Google Maps Location',
              uri: chunk.maps.uri,
            });
          } else if (chunk.web?.uri) {
            groundingLinks.push({
              title: chunk.web.title || 'Official Source',
              uri: chunk.web.uri,
            });
          }
        }

        return res.json({
          reply: replyText,
          groundingLinks,
          source: 'gemini-3.5-flash-maps',
        });
      } catch (geminiError: any) {
        console.error('Gemini API error in Back Bay chat:', geminiError?.message || geminiError);
        // Fall back gracefully to local tactical assistant if quota or network issue
      }
    }

    // Fallback response for Back Bay Satellite Office when API key is unavailable or throttled
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let tacticalReply = `Copy that Everett HQ. Back Bay Satellite Office acknowledges. We are actively monitoring Boylston, Newbury, and Commonwealth Ave corridors. All commercial parking bans are strictly enforced by Boston BTD.`;
    const defaultGrounding = [
      {
        title: 'Copley Square / Boylston St Snow Route',
        uri: 'https://maps.google.com/?q=Copley+Square+Boston+MA',
      },
      {
        title: 'Boston Public Works District 4 Yard',
        uri: 'https://maps.google.com/?q=Boston+Public+Works+Department',
      },
    ];

    if (lastUserMsg.includes('salt') || lastUserMsg.includes('depot') || lastUserMsg.includes('supply')) {
      tacticalReply = `Back Bay Logistics: Secondary salt staging yard is operational at Dartmouth St yard. We currently have 40 tons of pre-treated calcium chloride and liquid brine. Unit-04 and Unit-05 can pull in through the rear alley without blocking traffic.`;
    } else if (lastUserMsg.includes('park') || lastUserMsg.includes('ban') || lastUserMsg.includes('tow')) {
      tacticalReply = `City of Boston declared a declared Snow Emergency. Tow trucks are clearing all designated emergency arteries along Dartmouth, Beacon, and Huntington Ave. Ensure plows push to curb lines where cars have been removed.`;
    } else if (lastUserMsg.includes('hospital') || lastUserMsg.includes('emergency')) {
      tacticalReply = `Priority 1 Medical Access: Keep Dartmouth St to Huntington Ave clear for emergency medical transport to Boston Medical Center and Tufts Medical. Our skid steers are stationed on standby for zero-tolerance curb clearing.`;
    }

    return res.json({
      reply: tacticalReply,
      groundingLinks: defaultGrounding,
      source: 'satellite-dispatch-local',
    });
  } catch (err: any) {
    console.error('Back Bay chat endpoint error:', err);
    res.status(500).json({ error: 'Internal dispatch communication error' });
  }
});

// Production or Development Vite setup
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SnowOps Tactical Server running on http://localhost:${PORT}`);
  });
}

startServer();
