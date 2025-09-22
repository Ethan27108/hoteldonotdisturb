import SwitchButton from 'Components/SwitchButton'
import React, { useEffect } from 'react'
import { useState } from 'react';
import { getCSRFToken } from 'utils/csrf';
interface Room {
  roomNum: number;
  // add other fields if needed
}

const Dashboard = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  
  const fetchRooms = async (username: string | null) => {
      try {
        const response = await fetch('/api/getRoom/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
          },
          credentials: 'include',
          body: JSON.stringify({ username }),
        });

        const data = await response.json();

        if (response.ok) {
          setRooms(data.rooms);
          setUsername(data.username);
        }
        else {
          console.error('Failed to fetch rooms');
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
  };

  const startCleaning = async (username: string | null, room: number) => {
      try {
        const response = await fetch('/api/cleanStart/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, room }),
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

  const endCleaning = async (username: string | null, room: number) => {
      try {
        const response = await fetch('/api/cleanEnd/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, room }),
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
    const username = localStorage.getItem('username');
    setUsername(username);
    console.log(username);
    fetchRooms(username);
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
                  startCleaning(username, room.roomNum);
                  console.log("Send the current time to the database for the starting room clean");
                } else {
                  endCleaning(username, room.roomNum);
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
