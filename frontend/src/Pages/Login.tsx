import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const translations = {
  en: {
    login: 'Login',
    loginFailed: 'Login failed',
    errorConnecting: 'Error connecting to server',
    username: 'Username:',
    password: 'Password:',
    role: 'Role:',
    selectRole: 'Select Role',
    maid: 'Maid',
    admin: 'Admin',
    loggingIn: 'Logging in...',
    loginButton: 'Login',
    language: 'Language',
    english: 'English',
    french: 'French',
  },
  fr: {
    login: 'Connexion',
    loginFailed: 'Échec de la connexion',
    errorConnecting: 'Erreur de connexion au serveur',
    username: 'Nom d\'utilisateur:',
    password: 'Mot de passe:',
    role: 'Rôle:',
    selectRole: 'Sélectionner le rôle',
    maid: 'Femme de chambre',
    admin: 'Administrateur',
    loggingIn: 'Connexion en cours...',
    loginButton: 'Se connecter',
    language: 'Langue',
    english: 'Anglais',
    french: 'Français',
  },
}
interface LoginResponse {
  token: string;
  success: boolean;
  role: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rolePage, setRolePage] = useState<string>(''); // Added role state
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Added loading state
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  // Load language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'fr' | null;
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when request is in progress

    try {
      
      const endpoint = `/api/login/${rolePage}/`; // role is either 'maid' or 'admin'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }), // Include role in the body
      });

      const data: LoginResponse = await response.json();
      
      if (response.ok && data.success) {
        if (data.role === 'admin') {
          localStorage.setItem('token', data.token); // Store token in localStorage
          localStorage.setItem('username', username); // Store token in localStorage
        navigate('/admin');
        }
        else if (data.role === 'maid') {
          localStorage.setItem('token', data.token); // Store token in localStorage
          localStorage.setItem('username', username); // Store token in localStorage
          navigate('/dashboard');
        }
      } else {
        setMessage(translations[language].loginFailed);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage(translations[language].errorConnecting);
    } finally {
      setLoading(false); // Reset loading state after response
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <label style={{ fontSize: '14px', color: '#333' }}>{translations[language].language}:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="en">{translations[language].english}</option>
          <option value="fr">{translations[language].french}</option>
        </select>
      </div>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#333',
          fontSize: '24px'
        }}>{translations[language].login}</h2>
        {message && (
          <div
            style={{
              color: message === 'Logged in successfully!' ? 'green' : 'red',
              marginBottom: '1rem',
              textAlign: 'center',
              fontSize: '14px'
            }}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              color: '#555'
            }}>{translations[language].username}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              color: '#555'
            }}>{translations[language].password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '14px',
              color: '#555'
            }}>{translations[language].role}</label>
            <select
              value={rolePage}
              onChange={(e) => setRolePage(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">{translations[language].selectRole}</option>
              <option value="maid">{translations[language].maid}</option>
              <option value="admin">{translations[language].admin}</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0056b3')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#007bff')}
          >
            {loading ? translations[language].loggingIn : translations[language].loginButton}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
