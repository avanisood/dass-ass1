import { createTheme } from '@mui/material/styles';

/**
 * Celestial Theme for Felicity Event Management System
 * A sophisticated theme with teal, gold, and elegant typography
 */
const celestialTheme = createTheme({
  palette: {
    primary: {
      main: '#2D7A8C',
      light: '#5BA3B8',
      dark: '#1A4D5C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#D4AF37',
      light: '#E5C966',
      dark: '#B8941F',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#E8F4F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F2932',
      secondary: '#2D7A8C',
    },
    divider: '#5BA3B8',
    success: {
      main: '#4CAF50',
    },
    error: {
      main: '#F44336',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#2196F3',
    },
  },
  typography: {
    fontFamily: 'Raleway, Arial, sans-serif',
    // Headers h1-h3 use Cinzel
    h1: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '0.02em',
      color: '#0F2932',
    },
    h2: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      fontSize: '2.5rem',
      lineHeight: 1.3,
      letterSpacing: '0.01em',
      color: '#0F2932',
    },
    h3: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.4,
      letterSpacing: '0.01em',
      color: '#0F2932',
    },
    // Headers h4-h6 use Cormorant Garamond
    h4: {
      fontFamily: 'Cormorant Garamond, serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      color: '#0F2932',
    },
    h5: {
      fontFamily: 'Cormorant Garamond, serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.5,
      color: '#0F2932',
    },
    h6: {
      fontFamily: 'Cormorant Garamond, serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      color: '#0F2932',
    },
    // Body text uses Cormorant Garamond
    body1: {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '1.125rem',
      lineHeight: 1.7,
      color: '#0F2932',
    },
    body2: {
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#2D7A8C',
    },
    // Buttons use Raleway
    button: {
      fontFamily: 'Raleway, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      textTransform: 'none',
      letterSpacing: '0.05em',
    },
    caption: {
      fontFamily: 'Raleway, sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#2D7A8C',
    },
    overline: {
      fontFamily: 'Raleway, sans-serif',
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#2D7A8C',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(29, 122, 140, 0.08)',
    '0px 4px 8px rgba(29, 122, 140, 0.12)',
    '0px 8px 16px rgba(29, 122, 140, 0.16)',
    '0px 12px 24px rgba(29, 122, 140, 0.20)',
    '0px 16px 32px rgba(29, 122, 140, 0.24)',
    '0px 20px 40px rgba(29, 122, 140, 0.28)',
    '0px 24px 48px rgba(29, 122, 140, 0.32)',
    '0px 2px 4px rgba(29, 122, 140, 0.08)',
    '0px 4px 8px rgba(29, 122, 140, 0.12)',
    '0px 8px 16px rgba(29, 122, 140, 0.16)',
    '0px 12px 24px rgba(29, 122, 140, 0.20)',
    '0px 16px 32px rgba(29, 122, 140, 0.24)',
    '0px 20px 40px rgba(29, 122, 140, 0.28)',
    '0px 24px 48px rgba(29, 122, 140, 0.32)',
    '0px 2px 4px rgba(29, 122, 140, 0.08)',
    '0px 4px 8px rgba(29, 122, 140, 0.12)',
    '0px 8px 16px rgba(29, 122, 140, 0.16)',
    '0px 12px 24px rgba(29, 122, 140, 0.20)',
    '0px 16px 32px rgba(29, 122, 140, 0.24)',
    '0px 20px 40px rgba(29, 122, 140, 0.28)',
    '0px 24px 48px rgba(29, 122, 140, 0.32)',
    '0px 2px 4px rgba(29, 122, 140, 0.08)',
    '0px 4px 8px rgba(29, 122, 140, 0.12)',
    '0px 8px 16px rgba(29, 122, 140, 0.16)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          padding: '10px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 8px 20px rgba(45, 122, 140, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #2D7A8C 0%, #5BA3B8 100%)',
          color: '#FFFFFF',
          boxShadow: '0px 4px 12px rgba(45, 122, 140, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1A4D5C 0%, #2D7A8C 100%)',
            boxShadow: '0px 8px 20px rgba(45, 122, 140, 0.4)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: '#2D7A8C',
          color: '#2D7A8C',
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            borderColor: '#1A4D5C',
            backgroundColor: 'rgba(45, 122, 140, 0.05)',
          },
        },
        text: {
          color: '#2D7A8C',
          '&:hover': {
            backgroundColor: 'rgba(45, 122, 140, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FCFD 100%)',
          border: '2px solid #5BA3B8',
          boxShadow: '0px 8px 24px rgba(45, 122, 140, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 32px rgba(45, 122, 140, 0.20)',
            borderColor: '#2D7A8C',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0px 4px 16px rgba(45, 122, 140, 0.10)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(45, 122, 140, 0.08)',
        },
        elevation2: {
          boxShadow: '0px 4px 12px rgba(45, 122, 140, 0.12)',
        },
        elevation3: {
          boxShadow: '0px 8px 24px rgba(45, 122, 140, 0.16)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: '#5BA3B8',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: '#2D7A8C',
              borderWidth: '2px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2D7A8C',
              borderWidth: '2px',
              boxShadow: '0px 0px 0px 4px rgba(45, 122, 140, 0.1)',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#2D7A8C',
            fontWeight: 600,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2D7A8C',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1A4D5C 0%, #2D7A8C 50%, #5BA3B8 100%)',
          boxShadow: '0px 4px 20px rgba(45, 122, 140, 0.25)',
        },
        colorPrimary: {
          background: 'linear-gradient(90deg, #1A4D5C 0%, #2D7A8C 50%, #5BA3B8 100%)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: '#E8F4F8',
          color: '#2D7A8C',
          '&:hover': {
            backgroundColor: '#D0E9F0',
          },
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #2D7A8C 0%, #5BA3B8 100%)',
          color: '#FFFFFF',
        },
        colorSecondary: {
          backgroundColor: '#D4AF37',
          color: '#FFFFFF',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: '#1A4D5C',
          backgroundColor: '#E8F4F8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        body: {
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.05rem',
          color: '#0F2932',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: 'Raleway, sans-serif',
          fontWeight: 600,
          fontSize: '1rem',
          textTransform: 'none',
          color: '#2D7A8C',
          '&.Mui-selected': {
            color: '#1A4D5C',
            fontWeight: 700,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#D4AF37',
          height: '3px',
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          padding: '8px',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: 'Cinzel, serif',
          fontSize: '1.75rem',
          fontWeight: 600,
          color: '#0F2932',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          fontFamily: 'Raleway, sans-serif',
        },
        standardSuccess: {
          backgroundColor: '#E8F5E9',
          color: '#2E7D32',
        },
        standardError: {
          backgroundColor: '#FFEBEE',
          color: '#C62828',
        },
        standardWarning: {
          backgroundColor: '#FFF3E0',
          color: '#E65100',
        },
        standardInfo: {
          backgroundColor: '#E8F4F8',
          color: '#1A4D5C',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          marginBottom: '4px',
          '&:hover': {
            backgroundColor: '#E8F4F8',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#5BA3B8',
          opacity: 0.3,
        },
      },
    },
  },
});

export default celestialTheme;
