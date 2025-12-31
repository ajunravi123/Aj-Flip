<div align="center">

# Aj-Flip

**Created by Ajun Ravi**

Turn PDFs into Living Books with realistic 3D page flips, immersive audio, and AI-powered insights.

</div>

## About

Aj-Flip is a next-generation PDF reader that transforms your documents into an immersive reading experience. Experience realistic 3D page physics, tactile audio feedback, and AI-powered content insights.

## Features

- **3D Page Physics** - Advanced rendering engine simulates real-world paper physics
- **Immersive Audio** - Spatial sound effects that respond to your interactions
- **AI-Powered Insights** - Intelligent assistant for understanding and exploring content
- **Modern UI** - Beautiful, intuitive interface designed for the best reading experience

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory and set your Groq API key:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3001  # Optional: Backend server port (defaults to 3001)
   # NODE_TLS_REJECT_UNAUTHORIZED=0  # Only if you encounter SSL certificate errors (development only!)
   ```
   **Note:** The API key is stored server-side and never exposed to the frontend for security.
   
   **SSL Certificate Issues:** If you encounter SSL certificate errors, you can temporarily set `NODE_TLS_REJECT_UNAUTHORIZED=0` in your `.env` file for development. **Never use this in production!**

3. Run both the backend server and frontend development server:
   ```bash
   npm run dev:all
   ```
   
   Or run them separately:
   ```bash
   # Terminal 1 - Backend server (default port 3001)
   npm run server
   
   # Or specify a custom port:
   PORT=3002 npm run server
   
   # Terminal 2 - Frontend dev server (port 3000)
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Production Build

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```
