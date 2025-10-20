import SwitchButton from 'Components/SwitchButton'
import React, { useEffect, useState } from 'react'

interface Room {
  room_id: number;
  room_number: number;
  status: string;
  battery_indicator: number;
  battery_last_checked: string;
  updated_at: string;
}

const Dashboard = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [maidId, setMaidId] = useState<string | null>(null);

  const [comment, setComment] = useState<string>('');
  const handleCommentChange = (value: string) => setComment(value);

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

  const fetchRooms = async (maidId: string | null) => {
    if (!maidId || !token) {

      console.error('Missing maidId or token for fetchRooms');
      return;
    }

    try {
      const response = await fetch('/api/getRoom/', {
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
  };

  const startCleaning = async (maid_id: string | null, room_number: number) => {
    if (!maidId || !token) {
      console.error('Missing maidId or token for startCleaning');
      return;
    }

    try {
      const response = await fetch('/api/cleanStart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ maid_id, room_number }),
      });

      if (response.ok) {
        console.log('Started cleaning room', room_number);
      } else {
        console.error('Failed to start cleaning');
      }
    } catch (error) {
      console.error('Error starting cleaning:', error);
    }
  };
  const endCleaning = async (maid_id: string | null, room_number: number, commentText: string = '') => {
    if (!maidId || !token) {
      console.error('Missing maidId or token for endCleaning');
      return;
    }

    try {
      const response = await fetch('/api/cleanEnd/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ maid_id, room_number, comment: commentText }),
      });

      if (response.ok) {
        console.log('Ended cleaning room', room_number, 'comment sent:', commentText);
      } else {
        console.error('Failed to end cleaning');
      }
   } catch (error) {
      console.error('Error ending cleaning:', error);
    }
  };

  // Load token and username from localStorage once
  useEffect(() => {
    const localToken = localStorage.getItem('token');
    const localUsername = localStorage.getItem('username');

    setToken(localToken);
    setUsername(localUsername);
  }, []);

  // When token and username are ready, fetch maid ID
  useEffect(() => {
    if (token && username) {
      getMaidId(username);
    }
  }, [token, username]);

  // When maidId is ready, fetch rooms
  useEffect(() => {
    if (maidId && token) {
      fetchRooms(maidId);
    }
  }, [maidId, token]);

  return (
    <div>
      {rooms.map((room, index) => (
        <div key={room.room_number}>
          

          {/* Render switch only for the first room */}
          {index === 0 && (
            <div>
              <p>Room {room.room_number}</p>
              <p> 
                Battery Level: {room.battery_indicator}%
              </p>
              <SwitchButton
                name='Start Room Clean'
                secondname='Stop Room Clean'
                roomNum={room.room_number}
                onToggle={(on) => {
                  if (on) {
                    startCleaning(maidId, room.room_number);
                    console.log("Start room cleaning timestamp recorded");
                  } else {
                    endCleaning(maidId, room.room_number, comment);
                    console.log("End room cleaning timestamp recorded, comment sent");
                    setComment('');
                    setRooms(rooms.filter(r => r.room_number !== room.room_number));
                  }
                }}
              />
              <textarea
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleCommentChange(e.currentTarget.value)
                }
                placeholder="Add comment..."
                rows={5}
              />
            </div>
          )}

          {index !== 0 && (<div>
              <p>Room {room.room_number}</p>
              <p> 
                Battery Level: {room.battery_indicator}%
              </p>
            </div>
          )}

        </div>
      ))}
    </div>
  );
};

export default Dashboard;
