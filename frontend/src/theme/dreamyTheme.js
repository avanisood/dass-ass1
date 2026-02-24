import { createTheme } from '@mui/material/styles';

const dreamyTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6B9BC3',
      light: '#B8D8D8',
      dark: '#2B4C6F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E8C17C',
      light: '#F4D4A8',
      dark: '#D4A574',
    },
    background: {
      default: '#B8D8D8',
      paper: '#FEFEFE',
    },
    text: {
      primary: '#2C2C2C',
      secondary: '#3D3D3D',
    },
    success: {
      main: '#6BA368',
    },
    error: {
      main: '#C65D4F',
    },
    warning: {
      main: '#E8C17C',
    },
    info: {
      main: '#6B9BC3',
    },
  },
  typography: {
    fontFamily: '"Karla", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Space Mono", monospace',
      fontWeight: 700,
      fontSize: '2.5rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    h2: {
      fontFamily: '"Space Mono", monospace',
      fontWeight: 700,
      fontSize: '2rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    h3: {
      fontFamily: '"Space Mono", monospace',
      fontWeight: 700,
      fontSize: '1.5rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    h4: {
      fontFamily: '"DM Serif Display", serif',
      fontWeight: 400,
      fontSize: '1.75rem',
    },
    h5: {
      fontFamily: '"DM Serif Display", serif',
      fontWeight: 400,
      fontSize: '1.5rem',
    },
    h6: {
      fontFamily: '"DM Serif Display", serif',
      fontWeight: 400,
      fontSize: '1.25rem',
    },
    body1: {
      fontFamily: '"Karla", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Karla", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontFamily: '"Space Mono", monospace',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          border: '2px solid #3D3D3D',
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          textTransform: 'uppercase',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#FEFEFE',
          color: '#2C2C2C',
          '&:hover': {
            backgroundColor: '#f0f0f0',
            transform: 'translate(2px, 2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '3px solid #3D3D3D',
          borderRadius: 8,
          boxShadow: 'none',
          backgroundColor: '#FEFEFE',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '3px solid #3D3D3D',
          borderRadius: 8,
          boxShadow: 'none',
          backgroundColor: '#FEFEFE',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#3D3D3D',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#2C2C2C',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6B9BC3',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          border: '2px solid #3D3D3D',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#B8D8D8',
          borderBottom: '3px solid #3D3D3D',
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '3px solid #3D3D3D',
          borderRadius: 8,
        },
      },
    },
  },
});

export default dreamyTheme;
