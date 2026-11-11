/**
 * Point d'Entrée Principal React 18 DOM ReVibe FliP
 * 
 * Initialise le rendu de l'application dans le nœud HTML '#root' avec React StrictMode.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
