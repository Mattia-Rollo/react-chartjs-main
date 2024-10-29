import { FC, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Button, Container } from '@mui/material';
import { LoadingFallback } from './components/LoadingComponent';
import "./App.css";

const Dashboard = lazy(() => 
  new Promise<typeof import('./components/Dashboard')>(resolve => 
    setTimeout(() => 
      import('./components/Dashboard').then(module => resolve(module)), 
      2000
    )
  )
);
const FlightDataChart = lazy(() => import('./components/FlightDataChart'));
const SpeseMensiliDashboard = lazy(async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return import('./components/DashboardBank');
});
const TestPage = lazy(() => import('./pages/TestPage'));

export const App: FC = () => {
  return (
    <Router>
      <div className="App">
        <AppBar position="static">
          <Toolbar>
            <Button color="inherit" component={Link} to="/">Dashboard</Button>
            <Button color="inherit" component={Link} to="/flight-data">Flight Data</Button>
            <Button color="inherit" component={Link} to="/bank-dashboard">Bank Dashboard</Button>
            <Button color="inherit" component={Link} to="/test-chart">TEST Chart</Button>
          </Toolbar>
        </AppBar>

        <Container>
          <Suspense fallback={<LoadingFallback delay={2000} />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route 
                path="/flight-data" 
                element={
                  <div className="dataCard revenueCard">
                    <FlightDataChart />
                  </div>
                } 
              />
              <Route 
                path="/bank-dashboard" 
                element={
                  <div className="bankCard dataCard">
                    <SpeseMensiliDashboard />
                  </div>
                } 
              />
              <Route 
                path="/test-chart" 
                element={
                  <div className="test chart">
                    <TestPage />
                  </div>
                } 
              />
            </Routes>
          </Suspense>
        </Container>
      </div>
    </Router>
  );
};