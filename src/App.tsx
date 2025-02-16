import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Login from './pages/Login';
import Register from './pages/Register';
import NijaWalletPage from './pages/Wallets/NijaWalletPage';
import Home from './pages/Home';
import { ParentalProvider } from './contexts/ParentalContext';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ParentalProvider>
      <Router>
        <div className="min-h-screen bg-slate-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/nijawallet" element={<NijaWalletPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <ToastContainer 
            position="top-right" 
            autoClose={5000} 
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
      </Router>
    </ParentalProvider>
  );
}

export default App;