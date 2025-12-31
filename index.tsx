
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// StrictMode can cause "dispatcher is null" errors in React 18 when libraries 
// use internal refs and are double-mounted. Removing it for stability with react-pageflip.
root.render(<App />);
