'use client';

import { createTheme, ThemeProvider, PaletteMode } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useMemo } from 'react';

// Whop brand colors from https://brand.whop.com/
const dragonFire = '#FA4616'; // Primary orange - Dragon Fire
const midnight = '#141212'; // Dark background - Midnight
const snow = '#FCF6F5'; // Light background - Snow

// Derived colors
const whopOrange = dragonFire;
const whopOrangeDark = '#E86644'; // Extended palette variant
const whopOrangeLight = '#F6DCD5'; // Extended palette variant

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: whopOrange,
      light: whopOrangeLight,
      dark: whopOrangeDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1A1A1A',
      light: '#333333',
      dark: '#000000',
    },
    background: {
      default: snow, // #FCF6F5 - Whop Snow
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
    },
    error: {
      main: '#DC3545',
    },
    success: {
      main: '#28A745',
    },
  },
  typography: {
    fontFamily: [
      'FFF Acid Grotesk',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: whopOrange,
      light: whopOrangeLight,
      dark: whopOrangeDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFFFFF',
      light: '#E0E0E0',
      dark: '#B0B0B0',
    },
    background: {
      default: midnight, // #141212 - Whop Midnight
      paper: '#1F1F1F',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
    error: {
      main: '#FF5252',
    },
    success: {
      main: '#4CAF50',
    },
  },
  typography: {
    fontFamily: [
      'FFF Acid Grotesk',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export function WhopThemeProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const mode: PaletteMode = systemPrefersDark ? 'dark' : 'light';

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export { lightTheme, darkTheme };

