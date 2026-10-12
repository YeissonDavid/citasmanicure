import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicCalendar from './pages/PublicCalendar';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';

// Rutas protegidas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicCalendar />} />
        <Route path="/admin/login" element={<Login />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
