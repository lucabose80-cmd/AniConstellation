import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#D0BCFF',
      light: '#EADDFF',
      dark: '#381E72',
      contrastText: '#381E72',
    },
    secondary: {
      main: '#CCC2DC',
      light: '#E8DEF8',
      dark: '#332D41',
      contrastText: '#332D41',
    },
    background: {
      default: '#1C1B1F',
      paper: '#2B2930',
    },
    text: {
      primary: '#E6E1E5',
      secondary: '#CAC4D0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '100px', // MD3 fully rounded buttons
          textTransform: 'none', // MD3 buttons are not uppercase
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px', // MD3 standard corner radius
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Disable MUI v4 paper elevation overlay in dark mode for cleaner MD3 look
        },
      },
    },
  },
});

export default theme;
