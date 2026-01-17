import React from 'react';
import ReactDOM from 'react-dom/client';
// Importăm componenta App folosind extensia explicită .jsx pentru a ajuta procesul de compilare
import App from './App.jsx';

/**
 * IMPORT STILURI GLOBALE
 * Notă: Pentru ca acest import să funcționeze pe calculatorul tău, 
 * trebuie să rulezi comanda "npm install bootstrap" în folderul frontend.
 */
import 'bootstrap/dist/css/bootstrap.min.css';

// Punctul de intrare al aplicației React
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}