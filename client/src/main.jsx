import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
// Page-area styles for the redesign phases built in parallel (merged into index.css in Phase 8)
import './styles/home.css';
import './styles/gigs.css';
import './styles/people.css';
import './styles/messaging.css';
import './styles/rest.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
