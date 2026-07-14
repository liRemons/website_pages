import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { ThemeProvider } from '@/hooks/useTheme';

const container = document.getElementById('container');
const root = createRoot(container);

root.render(
  <ThemeProvider><App /></ThemeProvider>
);
