import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import UsernameSetup from './components/auth/UsernameSetup';
import MainApp from './components/MainApp';

function AppContent() {
  const { currentUser, firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!firebaseUser) {
    return <LoginPage />;
  }

  // Logged in but no profile
  if (!currentUser) {
    return <UsernameSetup />;
  }

  // Fully authenticated
  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
