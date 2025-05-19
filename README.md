# llm-banking-assistant

This is a full-stack AI-powered chatbot tailored for banking interactions. It features a modern React + TypeScript frontend styled with MUI and a Node.js + Express backend that communicates with an LLM-based API using `ollama-node`.

## Project Structure

* **Frontend**: React + TypeScript, Material UI
* **Backend**: Node.js + Express + TypeScript
* **LLM API**: Powered via `ollama-node`
* **Environment Configuration**: `.env` file for backend secrets and port setup

---

## Features

* Conversational UI with clear bot/user distinction
* MUI-driven components for polished UX
* Robust error and loading state handling
* Decoupled API integration for LLM responses
* Type-safe architecture across frontend and backend

---

## Architecture & Design Highlights

* **Frontend**  
   * Built with React 18 and TypeScript for type safety and scalability  
   * Custom UI theme using Material UI (`@mui/material`)  
   * Stateless functional components with React Hooks (`useState`)  
   * Isolated UI components for rendering user/bot messages  
   * Responsive layout using `Container`, `Box`, and MUI's system props
* **Backend**  
   * Express.js server in TypeScript for clean, modular structure  
   * Uses `ollama-node` to handle streaming LLM responses  
   * Middleware-managed CORS and JSON body parsing  
   * Structured API route (`/api/chat/message`) for message processing  
   * Environment-driven configuration with `.env` for security and portability
* **Integration**  
   * Frontend sends POST requests to backend API endpoint  
   * Backend processes input and returns real-time LLM-based chatbot responses  
   * Loading and error UI states handled gracefully on the client side

---

## Scalability & Extensibility Considerations

* **Model Swappability**: The backend is designed to support easy integration with different LLM providers (OpenAI, Ollama, etc.) via a clean abstraction layer.
* **API Versioning**: API routes are namespaced (`/api/chat`) to allow for future versions without breaking existing clients.
* **Component Isolation**: UI logic is modularized to allow for rapid feature development or UI redesigns without regressions.
* **State Management Readiness**: While `useState` is currently used, the architecture supports seamless migration to `Redux` or `Zustand` if global state becomes complex.
* **Deployment Ready**: Environment configurations are separated for frontend and backend, supporting deployment to Vercel, Netlify, Heroku, or containerized environments.
* **Security Focus**: Secrets and API keys are never exposed on the client; `.env` usage and proxy setup ensure safe API interactions.

---

## Technologies Used

* **React 18** with `create-react-app` (TypeScript)
* **Material UI** for component styling
* **Node.js** with `express` and `cors`
* **Ollama Node** for LLM interaction
* **TypeScript** across the stack

---

## Future Enhancements

* **Authentication Integration**: Add login support with OAuth2 and session persistence
* **Chat History Storage**: Persist user conversations with a database like PostgreSQL or MongoDB
* **Multi-Agent Flow**: Enable routing between specialized AI agents (e.g., loan advisor, fraud alert, account summary)
* **Real-time Streaming**: Enhance UX with token-by-token message streaming from the backend
* **Voice Input**: Integrate Web Speech API for hands-free interaction
* **Analytics Dashboard**: Track user engagement, message frequency, and model performance 