import SwitchButton from 'Components/SwitchButton'
import React, { useEffect } from 'react'
import { useState } from 'react';
interface Room {
  roomNum: number;
}

const Dashboard = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [maidId, setMaidId] = useState<string | null>(null);

  const getMaidId = async (username: string | null) => {
      try {
        const response = await fetch('/api/getMaidId/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        });

        const data = await response.json();

        if (response.ok) {
          setMaidId(data.maid_id);
        }
        else {
          console.error('Failed to get Maid Id');
        }
      } catch (error) {
        console.error('Error getting maid Id:', error);
      }
  }
  const fetchRooms = async (maidId: string | null) => {
      try {
        const response = await fetch('/api/getRoom/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ maidId }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(data.rooms);
          setRooms(data.rooms);
        }
        else {
          console.error('Failed to fetch rooms');
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
  };

  const startCleaning = async (maidId: string | null, room: number) => {
      try {
        const response = await fetch('/api/cleanStart/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ maidId, room }),
        });

        if (response.ok) {
          console.log(response)
        }
        else {
          console.error('Failed to start cleaning');
        }
      } catch (error) {
        console.error('Error starting cleaning:', error);
      }
  };

  const endCleaning = async (maidId: string | null, room: number) => {
      try {
        const response = await fetch('/api/cleanEnd/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ maidId, room }),
        });

        if (response.ok) {
          console.log(response)
        }
        else {
          console.error('Failed to end cleaning');
        }
      } catch (error) {
        console.error('Error ending cleaning:', error);
      }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setToken(token);
    const username = localStorage.getItem('username');
    setUsername(username);
    console.log(username);
    getMaidId(username);
    fetchRooms(maidId);
  }, []); // ← Run only once

  return (
    <div>
      Maid Dashboard
      {rooms.map((room, index) => (
        <div key={room.roomNum}>
          {room.roomNum}
          
          {/* Render button only for the first room */}
          {index === 0 && (
            <SwitchButton
              name='Start Room Clean' 
              secondname='Stop Room Clean'
              roomNum={room.roomNum}
              onToggle={(on) => {
                if (on) {
                  startCleaning(maidId, room.roomNum);
                  console.log("Send the current time to the database for the starting room clean");
                } else {
                  endCleaning(maidId, room.roomNum);
                  console.log("Send the current time to the database for the ending room clean");
                  setRooms(rooms.filter(r => r.roomNum !== room.roomNum));
                }
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
