import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';

// Import your components
import Panel from './components/Panel';
import LandingPage from './components/LandingPage';
// Assuming you have an AuthScreen based on your file structure
import AuthScreen from './components/AuthScreen';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      {/* Toaster stays outside Routes so notifications persist across page navigation */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: 'bg-neutral-900 border border-neutral-800 text-white rounded-xl shadow-2xl font-sans',
        }}
      />

      <Routes>
        {/* Public facing Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication Route */}
        <Route path="/login" element={<AuthScreen />} />

        {/* The Main Application */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Panel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;