import React, { FC, lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Container, 
  useMediaQuery, 
  useTheme, 
  Divider,
  Fade,
  CssBaseline
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Flight as FlightIcon, 
  AccountBalance as BankIcon, 
  BarChart as ChartIcon,
  Timeline as SyncIcon,
  Equalizer as ChartJsIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import "./App.css";

// Lazy loading components with delay
const Dashboard = lazy<React.FC>(() =>
  new Promise(resolve =>
    setTimeout(() =>
      import('./components/Dashboard').then((module) => resolve({ default: module.default })),
      500
    )
  )
);
const FlightDataChart = lazy(() => import('./components/FlightDataChart'));
const SpeseMensiliDashboard = lazy(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return import('./components/DashboardBank');
});
const TestPage = lazy(() => import('./pages/TestPage'));
const SyncChartsApexcharts = lazy(() => import('./pages/SyncChartsApexcharts'));
const SyncChartsChartjs = lazy(() => import('./pages/SyncChartsChartjs'));

// Sidebar width
const drawerWidth = 240;

// Navigation items configuration
const navItems = [
  { path: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { path: "/flight-data", label: "Flight Data", icon: <FlightIcon /> },
  { path: "/bank-dashboard", label: "Bank Dashboard", icon: <BankIcon /> },
  { path: "/test-chart", label: "TEST Chart", icon: <ChartIcon /> },
  { path: "/sync-apexcharts", label: "Sync ApexCharts", icon: <SyncIcon /> },
  { path: "/sync-chartjs", label: "Sync ChartJS", icon: <ChartJsIcon /> },
];

// Un fallback invisibile per Suspense
const InvisibleFallback = () => <div style={{ display: 'none' }}></div>;

// Navigation component
const Navigation: FC<{ open: boolean; handleDrawerToggle: () => void }> = ({ open, handleDrawerToggle }) => {
  const location = useLocation();
  const theme = useTheme();
  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : theme.spacing(9),
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.primary.dark,
          color: 'white',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          ...(!open && {
            width: theme.spacing(7),
            [theme.breakpoints.up('sm')]: {
              width: theme.spacing(9),
            },
            overflowX: 'hidden'
          }),
        },
      }}
      open={open}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: open ? 'flex-end' : 'center',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar
      }}>
        {open && (
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, padding: 2 }}>
            App Menu
          </Typography>
        )}
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ color: 'white' }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              mt: 0.5,
              py: 1.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
              borderRadius: '4px',
              mx: 1,
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 0, 
              mr: open ? 2 : 'auto', 
              justifyContent: 'center',
              color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.6)',
            }}>
              {item.icon}
            </ListItemIcon>
            <Fade in={open}>
              <ListItemText 
                primary={item.label} 
                sx={{ 
                  opacity: open ? 1 : 0,
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  }
                }} 
              />
            </Fade>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

// Dynamic Title Component
const DynamicTitle: FC = () => {
  const location = useLocation();
  const currentNavItem = navItems.find(item => item.path === location.pathname);
  
  return (
    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
      {currentNavItem ? currentNavItem.label : "Dashboard App"}
    </Typography>
  );
};

// Main layout component
export const App: FC = () => {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Automatically close drawer on mobile - correzione con useEffect
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* Top App Bar */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
            marginLeft: open ? drawerWidth : 0,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ marginRight: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <DynamicTitle />
          </Toolbar>
        </AppBar>
        
        {/* Sidebar Navigation */}
        <Navigation open={open} handleDrawerToggle={handleDrawerToggle} />
        
        {/* Main Content - Area elastica */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            width: open ? `calc(100% - ${drawerWidth}px)` : '80%',
            // marginLeft: open ? 0 : `-${theme.spacing(7)}`,
            // [theme.breakpoints.up('sm')]: {
            //   marginLeft: open ? 0 : `-${theme.spacing(9)}`,
            // },
            marginTop: '64px',
            transition: theme.transitions.create(['width', 'margin', 'margin-left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Container 
            maxWidth="xl" 
            sx={{ 
              mt: 2,
              transition: theme.transitions.create('all', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            <Suspense fallback={<InvisibleFallback />}>
              <Routes>
                <Route path="/" element={
                  <Fade in={true} timeout={500}>
                    <Box><Dashboard /></Box>
                  </Fade>
                } />
                <Route
                  path="/flight-data"
                  element={
                    <Fade in={true} timeout={500}>
                      <div className="dataCard revenueCard">
                        <FlightDataChart />
                      </div>
                    </Fade>
                  }
                />
                <Route
                  path="/bank-dashboard"
                  element={
                    <Fade in={true} timeout={500}>
                      <div className="bankCard dataCard">
                        <SpeseMensiliDashboard />
                      </div>
                    </Fade>
                  }
                />
                <Route
                  path="/test-chart"
                  element={
                    <Fade in={true} timeout={500}>
                      <div className="test chart">
                        <TestPage />
                      </div>
                    </Fade>
                  }
                />
                <Route
                  path="/sync-apexcharts"
                  element={
                    <Fade in={true} timeout={500}>
                      <div className="sync-apexcharts">
                        <SyncChartsApexcharts />
                      </div>
                    </Fade>
                  }
                />
                <Route
                  path="/sync-chartjs"
                  element={
                    <Fade in={true} timeout={500}>
                      <div className="sync-chartjs">
                        <SyncChartsChartjs />
                      </div>
                    </Fade>
                  }
                />
              </Routes>
            </Suspense>
          </Container>
        </Box>
      </Box>
    </Router>
  );
};

/* CSS da aggiungere al tuo App.css */
/*
.dataCard {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dataCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.container-transition {
  transition: all 0.3s ease;
}
*/