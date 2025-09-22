import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCSRFToken } from 'utils/csrf';
interface LoginResponse {
  success: boolean;
  message: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>(''); // Added role state
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Added loading state
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/csrf/', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to get CSRF token");
        return res.json();
      })
      .then(() => {
        console.log("CSRF cookie set");
      })
      .catch((err) => {
        console.error("Error fetching CSRF token:", err);
      });
  }, []);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when request is in progress

    try {
      const csrfToken = getCSRFToken();
      localStorage.setItem('username', username);

      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ username, password, role }), // Include role in the body
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        navigate('/dashboard');
      } else {
        setMessage(data.message || 'Login failed');
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
