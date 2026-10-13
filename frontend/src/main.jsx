import React from 'react';
import ReactDOM from 'react-dom/client';
import { TabProvider } from './context/TabContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TabProvider>
      <App />
    </TabProvider>
  </React.StrictMode>,
);
