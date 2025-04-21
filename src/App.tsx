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
  CssBaseline,
  SvgIcon,
  SvgIconProps
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Flight as FlightIcon,
  AccountBalance as BankIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import "./App.css";

// Componenti delle icone personalizzate per le librerie di grafici
const ApexChartsIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    {/* Logo ispirato ad ApexCharts - triangolo con barre colorate */}
    <path d="M12 2L2 20h20L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 16l2-4 2 2 3-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
);

const ChartJsIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    {/* Logo ispirato a Chart.js - esagono con grafici a onda */}
    <path d="M4.15 7.15L12 3l7.85 4.15v8.7L12 20l-7.85-4.15z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 14c1-1 2-3 3-1s2 2 3 0 2-5 3-2 3 1 3 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
);

const UPlotIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    {/* Logo generico per uPlot - grafico a linee */}
    <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 16l4-6 4 4 4-8 4 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
);

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
const SyncChartsuPlot = lazy(() => import('./pages/SyncChartsuPlot'));

// Sidebar width
const drawerWidth = 240;

// Navigation items configuration con icone specifiche
const navItems = [
  { path: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { path: "/flight-data", label: "Flight Data", icon: <FlightIcon /> },
  { path: "/bank-dashboard", label: "Bank Dashboard", icon: <BankIcon /> },
  { path: "/test-chart", label: "TEST Chart", icon: <ApexChartsIcon /> },
  { path: "/sync-apexcharts", label: "Sync ApexCharts", icon: <ApexChartsIcon /> },
  { path: "/sync-chartjs", label: "Sync ChartJS", icon: <ChartJsIcon /> },
  { path: "/sync-uplot", label: "Sync uPlot", icon: <UPlotIcon /> },
];

// Un fallback invisibile per Suspense
const InvisibleFallback = () => <div style={{ display: 'none' }}></div>;

// Navigation component with completely fixed icon positions
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
          width: open ? drawerWidth : theme.spacing(9),
          boxSizing: 'border-box',
          backgroundColor: theme.palette.primary.dark,
          color: 'white',
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden'
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
          <Fade in={open} timeout={{ enter: 1500, exit: 0 }} >
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, padding: 1,m:0 }}>
              App Menu
            </Typography>
          </Fade>
        )}
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ color: 'white' }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
      
      {/* Fixed position navigation items */}
      <List sx={{ position: 'relative' }}>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.path}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              display: 'flex',
              // height: 48, // Fixed height for all items
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
              mt: 1,
              transition: 'background-color 0.2s ease-in-out', // Only animate background, not layout
              // Important position-related styling:
              position: 'relative',
              pl: 2, // Fixed padding left for icon positioning
            }}
          >
            {/* Absolutely positioned icon container */}
            <Box sx={{
              // position: 'absolute',
              // left: theme.spacing(1),
              // top: '50%',
              // transform: 'translateY(-50%)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              // width: 24,
              // height: 24,
            }}>
              <Box sx={{
                color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.6)'
              }}>
                {item.icon}
              </Box>
            </Box>
            
            {/* Text that appears only when drawer is open */}
            {open && (
              <Fade in={open} timeout={{ enter: 500, exit: 0 }}>
                <ListItemText
                  primary={item.label}
                  sx={{
                    ml: 3, // Add consistent margin from the icon
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    }
                  }}
                />
              </Fade>
            )}
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
  const [open, setOpen] = useState(false);
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
                <Route
                  path="/sync-uplot"
                  element={
                    <Fade in={true} timeout={500}>
                      <div className="/sync-uplot">
                        <SyncChartsuPlot />
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