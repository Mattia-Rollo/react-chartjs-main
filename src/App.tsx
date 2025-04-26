import { FC, lazy, Suspense, useState, memo } from "react";
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
  ListItemText,
  Container,
  // useMediaQuery,
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

// Componenti delle icone personalizzate memorizzate con memo
const ApexChartsIcon = memo((props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 2L2 20h20L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 16l2-4 2 2 3-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
));

const ChartJsIcon = memo((props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M4.15 7.15L12 3l7.85 4.15v8.7L12 20l-7.85-4.15z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 14c1-1 2-3 3-1s2 2 3 0 2-5 3-2 3 1 3 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
));

const UPlotIcon = memo((props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 16l4-6 4 4 4-8 4 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
));

// Ottimizzazione: Rimuovi il ritardo artificiale nel lazy loading
const Dashboard = lazy(() => import('./components/Dashboard'));
const FlightDataChart = lazy(() => import('./components/FlightDataChart'));
const SpeseMensiliDashboard = lazy(() => import('./components/DashboardBank'));
const TestPage = lazy(() => import('./pages/TestPage'));
const SyncChartsApexcharts = lazy(() => import('./pages/SyncChartsApexcharts'));
const SyncChartsChartjs = lazy(() => import('./pages/SyncChartsChartjs'));
const SyncChartsuPlot = lazy(() => import('./pages/SyncChartsuPlot'));
const SyncEcharts = lazy(() => import('./pages/SyncEcharts'));

// Sidebar width
const drawerWidth = 240;

// Navigation items configuration 
const navItems = [
  { path: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { path: "/flight-data", label: "Flight Data", icon: <FlightIcon /> },
  { path: "/bank-dashboard", label: "Bank Dashboard", icon: <BankIcon /> },
  { path: "/test-chart", label: "TEST Chart", icon: <ApexChartsIcon /> },
  { path: "/sync-apexcharts", label: "Sync ApexCharts", icon: <ApexChartsIcon /> },
  { path: "/sync-chartjs", label: "Sync ChartJS", icon: <ChartJsIcon /> },
  { path: "/sync-uplot", label: "Sync uPlot", icon: <UPlotIcon /> },
  { path: "/sync-echarts", label: "Sync Echarts", icon: <ApexChartsIcon /> },
];

// Componente Fallback ottimizzato che non causa re-rendering
const LoadingFallback = memo(() => <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Caricamento...</div>);

// Navigation component ottimizzato con memo
const Navigation = memo<{ open: boolean; handleDrawerToggle: () => void }>(({ open, handleDrawerToggle }) => {
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
          <Fade in={open} timeout={{ enter: 500, exit: 0 }} >
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
              transition: 'background-color 0.2s ease-in-out',
              position: 'relative',
              pl: 2,
            }}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Box sx={{
                color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.6)'
              }}>
                {item.icon}
              </Box>
            </Box>
            
            {open && (
              <Fade in={open} timeout={{ enter: 500, exit: 0 }}>
                <ListItemText
                  primary={item.label}
                  sx={{
                    ml: 3,
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
});

// Dynamic Title Component memorizzato
const DynamicTitle = memo(() => {
  const location = useLocation();
  const currentNavItem = navItems.find(item => item.path === location.pathname);

  return (
    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
      {currentNavItem ? currentNavItem.label : "Dashboard App"}
    </Typography>
  );
});

// Componente della pagina esternalizzato e memorizzato
const AppContent = memo(() => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

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

      <Navigation open={open} handleDrawerToggle={handleDrawerToggle} />

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
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={
                <Fade in={true} timeout={300}>
                  <Box><Dashboard /></Box>
                </Fade>
              } />
              <Route
                path="/flight-data"
                element={
                  <Fade in={true} timeout={300}>
                    <div className="dataCard revenueCard">
                      <FlightDataChart />
                    </div>
                  </Fade>
                }
              />
              <Route
                path="/bank-dashboard"
                element={
                  <Fade in={true} timeout={300}>
                    <div className="bankCard dataCard">
                      <SpeseMensiliDashboard />
                    </div>
                  </Fade>
                }
              />
              <Route
                path="/test-chart"
                element={
                  <Fade in={true} timeout={300}>
                    <div className="test chart">
                      <TestPage />
                    </div>
                  </Fade>
                }
              />
              <Route
                path="/sync-apexcharts"
                element={
                  <Fade in={true} timeout={300}>
                    <div className="sync-apexcharts">
                      <SyncChartsApexcharts />
                    </div>
                  </Fade>
                }
              />
              <Route
                path="/sync-chartjs"
                element={
                  <Fade in={true} timeout={300}>
                    <div className="sync-chartjs">
                      <SyncChartsChartjs />
                    </div>
                  </Fade>
                }
              />
              <Route
                path="/sync-uplot"
                element={
                  <Fade in={true} timeout={300}>
                    <div className="/sync-uplot">
                      <SyncChartsuPlot />
                    </div>
                  </Fade>
                }
              />
              <Route
                path="/sync-echarts"
                element={
                  <Fade in={true} timeout={0}>
                    <div className="/sync-echarts">
                      <SyncEcharts />
                    </div>
                  </Fade>
                }
              />
            </Routes>
          </Suspense>
        </Container>
      </Box>
    </Box>
  );
});

// Main layout component
export const App: FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};