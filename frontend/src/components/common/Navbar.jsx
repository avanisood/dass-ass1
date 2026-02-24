import React, { useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Event as EventIcon,
  QrCodeScanner as QrIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

/**
 * Navigation Bar Component
 * Shows role-specific navigation links and logout button
 */
const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Handle mobile menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigate to a page
  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  // Don't show navbar on login/register pages
  if (!user) {
    return null;
  }

  // Role-specific navigation items
  const getNavigationItems = () => {
    switch (user.role) {
      case 'participant':
        return [
          { label: 'Dashboard', path: '/participant/dashboard', icon: <DashboardIcon /> },
          { label: 'Browse Events', path: '/participant/events', icon: <EventIcon /> }
        ];
      
      case 'organizer':
        return [
          { label: 'Dashboard', path: '/organizer/dashboard', icon: <DashboardIcon /> },
          { label: 'Create Event', path: '/organizer/create-event', icon: <EventIcon /> },
          { label: 'QR Scanner', path: '/organizer/qr-scanner', icon: <QrIcon /> },
          { label: 'Profile', path: '/organizer/profile', icon: <PersonIcon /> }
        ];
      
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
          { label: 'Manage Organizers', path: '/admin/organizers', icon: <PeopleIcon /> }
        ];
      
      default:
        return [];
    }
  };

  const navItems = getNavigationItems();

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: '#B8D8D8', 
        borderBottom: '3px solid #3D3D3D', 
        boxShadow: 'none' 
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ display: 'flex' }}>
          {/* Logo/Title with cloud emoji */}
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              fontFamily: '"Space Mono", monospace',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#2C2C2C',
              textDecoration: 'none',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '1.2rem'
            }}
            onClick={() => handleNavigate(navItems[0]?.path || '/')}
          >
            ☁️ Felicity
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                className="window-button"
                startIcon={item.icon}
                onClick={() => handleNavigate(item.path)}
                sx={{ 
                  backgroundColor: '#FEFEFE',
                  border: '2px solid #3D3D3D',
                  color: '#2C2C2C',
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.75rem',
                  padding: '6px 16px',
                  '&:hover': { 
                    backgroundColor: '#f0f0f0',
                    transform: 'translate(2px, 2px)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Window Controls and Logout */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center', ml: 2 }}>
            {/* User Info */}
            <Typography variant="body2" sx={{ mr: 1, color: '#2C2C2C', fontFamily: '"Karla", sans-serif', fontSize: '0.875rem' }}>
              {user.firstName || user.organizerName || 'User'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                backgroundColor: '#F4D4A8',
                color: '#2C2C2C',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                border: '2px solid #3D3D3D',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 600,
                mr: 2
              }}
            >
              {user.role.toUpperCase()}
            </Typography>

            {/* Logout Button */}
            <Button
              className="window-button-gold"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ 
                backgroundColor: '#E8C17C',
                border: '2px solid #3D3D3D',
                borderRadius: '8px',
                color: '#2C2C2C',
                fontFamily: '"Space Mono", monospace',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: '6px 16px',
                ml: 1,
                '&:hover': { 
                  backgroundColor: '#D4A574',
                  transform: 'translate(2px, 2px)'
                }
              }}
            >
              Logout
            </Button>

            {/* Window Controls */}
            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
              <Typography className="window-controls" sx={{ color: '#3D3D3D' }}>
              </Typography>
            </Box>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            onClick={handleMenuOpen}
            sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              ml: 'auto',
              color: 'white'
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={{ display: { xs: 'block', md: 'none' } }}
            PaperProps={{
              sx: {
                borderRadius: 2,
                mt: 1
              }
            }}
          >
            {/* User Info in Mobile Menu */}
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {user.firstName || user.organizerName || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.role.toUpperCase()}
                </Typography>
              </Box>
            </MenuItem>
            
            <Box sx={{ borderTop: 1, borderColor: 'divider', my: 1 }} />
            
            {/* Navigation Items */}
            {navItems.map((item) => (
              <MenuItem 
                key={item.path}
                onClick={() => handleNavigate(item.path)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.icon}
                  {item.label}
                </Box>
              </MenuItem>
            ))}
            
            <Box sx={{ borderTop: 1, borderColor: 'divider', my: 1 }} />
            
            {/* Logout */}
            <MenuItem onClick={handleLogout}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LogoutIcon />
                Logout
              </Box>
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
