import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AlchemyProvider } from './context/AlchemyContext';
import { WalletProvider } from './contexts/WalletContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SolanaProvider } from './context/SolanaContext';
import { ParentalProvider } from './contexts/ParentalContext';
import { QueryProvider } from './providers/QueryProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Register from './pages/Register';
import Login from './pages/Login'; // We will create/modify this next
import Dashboard from './pages/Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <AlchemyProvider>
            <SolanaProvider>
              <WalletProvider>
                <ParentalProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/register" element={<Register />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/" element={<Navigate to="/login" replace />} />
                    </Routes>
                    <ToastContainer theme="dark" />
                  </BrowserRouter>
                </ParentalProvider>
              </WalletProvider>
            </SolanaProvider>
          </AlchemyProvider>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
