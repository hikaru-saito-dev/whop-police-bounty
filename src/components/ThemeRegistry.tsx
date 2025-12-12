'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { WhopThemeProvider } from '@/lib/theme';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <WhopThemeProvider>
      <CssBaseline />
      {children}
    </WhopThemeProvider>
  );
}

