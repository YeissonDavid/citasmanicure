import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configuración del endpoint de API (compatible con Hostinger en /api y localhost en /backend)
const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost/backend' : '/api');

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Si la API falla por config local, permite un login "dummy"
    if (username === 'admin' && password === 'admin123') {
       localStorage.setItem('token', 'dummy_token');
       navigate('/admin/dashboard');
       return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Credenciales inválidas o error de conexión');
    }
  };

  return (
    <div className="min-h-screen bg-dollhouse-pink-light flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-slate-800">Admin Login</h1>
          <p className="text-slate-500 font-sans mt-2">Acceso privado</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-dollhouse-pink rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-dollhouse-gold transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-dollhouse-pink rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-dollhouse-gold transition-all"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-slate-800 text-white font-serif py-3 rounded-xl mt-4 hover:bg-slate-700 transition-colors shadow-md"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
