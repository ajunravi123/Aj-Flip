import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load environment variables
dotenv.config();

// Disable SSL certificate verification for development
// Set DISABLE_SSL_VERIFY=false in .env to enable SSL verification in production
if (process.env.DISABLE_SSL_VERIFY === 'true' || process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Proxy endpoint - masks the Groq API call
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: { 
          message: 'API key not configured on server' 
        } 
      });
    }

    // Frontend only sends: question, bookContext, and currentPageText
    const { question, bookContext, currentPageText } = req.body;

    if (!question) {
      return res.status(400).json({ 
        error: { 
          message: 'Question is required' 
        } 
      });
    }

    // Build messages array on the backend with system prompt
    const messages = [
      {
        role: 'system',
        content: 'You are an expert reading assistant. Help the user understand the book content they are currently reading. Be concise, insightful, and encouraging.'
      },
      {
        role: 'user',
        content: `Book Title: ${bookContext || 'Unknown'}\n\nContext from current page: ${currentPageText || 'No context available'}\n\nUser question: ${question}`
      }
    ];

    // Model configuration is handled on the backend
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Fast, free, open-source model
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: errorData.error || { message: `API error: ${response.status}` }
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: { 
        message: 'Internal server error' 
      } 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

