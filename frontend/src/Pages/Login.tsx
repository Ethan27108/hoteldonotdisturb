import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
interface LoginResponse {
  token: string;
  success: boolean;
  role: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>(''); // Added role state
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Added loading state
  const navigate = useNavigate();


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when request is in progress

    try {
      

      const response = await fetch('/api/login/maid/', {
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
        navigate('/admin');
        }
        else if (data.role === 'maid') {
          localStorage.setItem('token', data.token); // Store token in localStorage
          navigate('/dashboard');
        }
      } else {
        setMessage('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Error connecting to server');
    } finally {
      setLoading(false); // Reset loading state after response
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Login</h2>
      {message && (
        <div
          style={{
            color: message === 'Logged in successfully!' ? 'green' : 'red',
            marginBottom: '1rem',
          }}
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Username:</label><br />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Role:</label><br />
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="">Select Role</option>
            <option value="maid">Maid</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
