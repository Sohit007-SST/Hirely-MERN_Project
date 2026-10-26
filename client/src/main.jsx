import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
// Page-area styles written by the wave-2 agents (merged into index.css at the end)
import './styles/gigs.css';
import './styles/people.css';
import './styles/realtime.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
