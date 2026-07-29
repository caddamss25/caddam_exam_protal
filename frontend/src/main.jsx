import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Dynamic API routing for external access (like ngrok)
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:8080')) {
    config.url = config.url.replace('http://localhost:8080', '');
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
