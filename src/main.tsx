import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AiProvider } from './context/AiContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AiProvider>
      <App />
    </AiProvider>
  </React.StrictMode>
);
