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

interface Stats {
  stat_id: number;
  date: string;
  total_rooms_cleaned: number;
  avg_rooms_per_shift: number;
  avg_time_per_room: number;
  working_hours: number;
  active_cleaning_hours: number;
  completion_rate: number;
  tasks_incomplete: number;
  emergency_tasks_handled: number;
  battery_changes_performed: number;
  on_time_shift_attendance: number;
  break_usage: number;
            
}
const Dashboard = () => {
  const [stats, setStats] = useState<Stats[]>([]);
  const [intervalTime, setIntervalTime] = useState<number>(15000); // 15 seconds
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

  const fetchStats = async (maidId: string | null) => {
    if (!maidId || !token) {
      console.error('Missing maidId or token for fetchStats');
      return;
    }
    try {
      const response = await fetch('/api/viewStats/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ maidId }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data.stats);
        setStats(data.stats);
      }
      else {
        console.error('Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
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

  useEffect(() => {
    if (maidId && token) {
      fetchRooms(maidId);
      fetchStats(maidId);
    }
  }, [maidId, token]);

  // When maidId is ready, fetch rooms
  useEffect(() => {
    if (!maidId || !token) return;
    const intervalId = setInterval(() => {
      fetchRooms(maidId);
      fetchStats(maidId);
    }, intervalTime); // change interval (ms) as needed

    return () => clearInterval(intervalId);
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
      <div>
             <h3>Statistics</h3>
              {stats.map((stat) => (
                <div key={stat.stat_id}>
                  <p>Date: {stat.date}</p>
                  <p>Total Rooms Cleaned: {stat.total_rooms_cleaned}</p>
                  <p>Average Rooms per Shift: {stat.avg_rooms_per_shift}</p>
                  <p>Average Time per Room: {stat.avg_time_per_room} minutes</p>
                  <p>Working Hours: {stat.working_hours} hours</p>
                  <p>Active Cleaning Hours: {stat.active_cleaning_hours} hours</p>
                  <p>Completion Rate: {stat.completion_rate}%</p>
                  <p>Tasks Incomplete: {stat.tasks_incomplete}</p>
                  <p>Emergency Tasks Handled: {stat.emergency_tasks_handled}</p>
                  <p>Battery Changes Performed: {stat.battery_changes_performed}</p>
                  <p>On-time Shift Attendance: {stat.on_time_shift_attendance}%</p>
                  <p>Break Usage: {stat.break_usage} minutes</p>
                </div>
              ))}
          </div>
    </div>
  );
};

export default Dashboard;
