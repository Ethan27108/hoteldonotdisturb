import React from 'react'
import { useEffect, useState } from 'react';

interface Room {
  room_id: number;
  room_number: number;
  status: string;
  battery_indicator: number;
  battery_last_checked: string;
  updated_at: string;
  comment: string;
}

const ProfileMaid = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [maidId, setMaidId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [usernameSwap, setUsernameSwap] = useState<string>('');
    const [password, setPassword] = useState<string>('');

  const getMaidId = async (username: string | null) => {
    if (!username || !token) {
      console.error('Missing username or token for getMaidId');
      return;
    }

    try {
      const response = await fetch('/api/getMaidId/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        setMaidId(data.maid_id);
      } else {
        console.error('Failed to get Maid Id');
      }
    } catch (error) {
      console.error('Error getting maid Id:', error);
    }
  }

  const fetchPrevRooms = async (maidId: string | null) => {
    if (!maidId || !token) {

      console.error('Missing maidId or token for fetchRooms');
      return;
    }

    try {
      const response = await fetch('/api/fetchPrevRoom/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ maidId }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(data.rooms);
        setRooms(data.rooms);
      } else {
        console.error('Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/changeSettings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ usernameSwap, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Settings updated successfully');
      } else {
        console.error('Failed to get Maid Id');
      }
    } catch (error) {
      console.error('Error getting maid Id:', error);
    }
  }
  useEffect(() => {
      const localToken = localStorage.getItem('token');
      const localUsername = localStorage.getItem('username');
  
      setToken(localToken);
      setUsername(localUsername);
    }, []);

  useEffect(() => {
      if (token && username) {
        getMaidId(username);
      }
    }, [token, username]);

  return (
    <div>ProfileMaid
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Username:</label><br />
          <input
            type="text"
            value={usernameSwap}
            onChange={(e) => setUsernameSwap(e.target.value)}
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
        <button type="submit">Submit</button>
        </form>
      <button onClick={() => fetchPrevRooms(maidId)}>Previous Rooms</button>
    </div>
  )
}

export default ProfileMaid