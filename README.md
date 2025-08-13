# LLM Chat Application

A modern, real-time chat application with AI integration, built with React, TypeScript, Node.js, and Socket.IO. Features a ChatGPT-like interface with persistent chat history, real-time streaming responses, and robust error handling.

## 🚀 Features

### Core Features
- **Real-time AI Chat**: Stream responses from Ollama models in real-time
- **Persistent Chat History**: Local storage with automatic sync
- **Multiple Chat Sessions**: Create, manage, and switch between conversations
- **Modern UI/UX**: Dark/light mode, responsive design, smooth animations
- **Connection Management**: Automatic reconnection and status indicators
- **Error Handling**: Graceful error recovery and user feedback

### Technical Features
- **TypeScript**: Full type safety across frontend and backend
- **Socket.IO**: Real-time bidirectional communication
- **LangChain**: AI model integration with Ollama
- **Rate Limiting**: Protection against abuse
- **Structured Logging**: Comprehensive logging for debugging
- **Environment Configuration**: Flexible configuration management
- **Security**: CORS protection and input validation

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.IO Client** for real-time communication
- **React Markdown** for message rendering

### Backend
- **Node.js** with TypeScript
- **Express.js** for API server
- **Socket.IO** for real-time communication
- **LangChain** for AI model integration
- **Ollama** for local LLM inference

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Ollama** installed and running locally
- **AI Model** (e.g., Gemma 3:4B) installed in Ollama

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Llm-Chat
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set Up Environment Variables

#### Backend (.env)
```bash
cd backend
cp env.example .env
```

Edit `.env`:
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Model Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
SESSION_SECRET=your-super-secret-key-here

# Logging
LOG_LEVEL=INFO
```

#### Frontend (.env)
```bash
cd frontend
cp env.example .env
```

Edit `.env`:
```env
# Server Configuration
VITE_SERVER_URL=http://localhost:4000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=false
```

### 4. Install and Start Ollama
```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# Install a model (in a new terminal)
ollama pull gemma3:4b
```

### 5. Start the Application

#### Development Mode
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

#### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

### 6. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

## 📁 Project Structure

```
Llm-Chat/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── header.ts          # CORS configuration
│   │   │   └── rateLimiter.ts     # Rate limiting
│   │   ├── socket/
│   │   │   ├── socketController.ts # Socket.IO setup
│   │   │   └── socket-handler/
│   │   │       └── chat.ts        # AI chat logic
│   │   ├── utils/
│   │   │   ├── envValidator.ts    # Environment validation
│   │   │   └── logger.ts          # Structured logging
│   │   └── index.ts               # Express app setup
│   ├── bin/
│   │   └── www.ts                 # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Reusable UI components
│   │   │   │   ├── loading-spinner.tsx
│   │   │   │   └── typing-indicator.tsx
│   │   │   └── Message.tsx        # Message component
│   │   ├── contexts/
│   │   │   └── ChatContext.tsx    # Chat state management
│   │   ├── hooks/
│   │   │   ├── SocketProvider.tsx # Socket.IO provider
│   │   │   └── useLocalStorage.ts # Local storage hook
│   │   ├── App.tsx                # Main app component
│   │   └── ChatGPTClone.tsx       # Chat interface
│   └── package.json
└── README.md
```

## 🔧 Configuration

### AI Model Configuration
The application uses Ollama for AI model inference. You can configure:

- **Model**: Change `OLLAMA_MODEL` in backend `.env`
- **Base URL**: Change `OLLAMA_BASE_URL` if Ollama runs on different port
- **Available Models**: Use `ollama list` to see installed models

### Rate Limiting
Configure rate limiting in backend `.env`:
- `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

### Logging
Configure logging level in backend `.env`:
- `ERROR`: Only error messages
- `WARN`: Warnings and errors
- `INFO`: Info, warnings, and errors (default)
- `DEBUG`: All messages

## 🎯 Usage

### Basic Chat
1. Open the application in your browser
2. Type a message in the input field
3. Press Enter or click Send
4. Watch the AI response stream in real-time

### Managing Chats
- **New Chat**: Click "New Chat" button in sidebar
- **Switch Chats**: Click on any chat in the sidebar
- **Delete Chat**: Hover over a chat and click the trash icon
- **Chat History**: All chats are automatically saved locally

### Features
- **Dark/Light Mode**: Toggle using the sun/moon icon
- **Connection Status**: See connection status in the top bar
- **Typing Indicators**: See when AI is responding
- **Message Status**: Visual indicators for message states
- **Auto-scroll**: Automatic scrolling to latest messages

## 🔍 Troubleshooting

### Common Issues

#### 1. "Unable to connect to AI model"
- Ensure Ollama is running: `ollama serve`
- Check if model is installed: `ollama list`
- Verify `OLLAMA_BASE_URL` in backend `.env`

#### 2. "Connection failed"
- Check if backend is running on correct port
- Verify `VITE_SERVER_URL` in frontend `.env`
- Check CORS configuration in backend

#### 3. "Rate limit exceeded"
- Wait for the rate limit window to reset
- Adjust rate limiting settings in backend `.env`

#### 4. Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript configuration
- Ensure all dependencies are installed

### Debug Mode
Enable debug logging by setting `LOG_LEVEL=DEBUG` in backend `.env`.

## 🚀 Deployment

### Backend Deployment
1. Build the TypeScript: `npm run build`
2. Set `NODE_ENV=production` in `.env`
3. Deploy to your preferred platform (Heroku, Vercel, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your preferred platform
3. Update `VITE_SERVER_URL` to point to your backend

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for local LLM inference
- [LangChain](https://langchain.com/) for AI integration
- [Socket.IO](https://socket.io/) for real-time communication
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
