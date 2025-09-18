import SwitchButton from 'Components/SwitchButton'
import React, { useEffect } from 'react'
import { useState } from 'react';

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
          },
          body: JSON.stringify({ username }),
        });

        const data = await response.json();

        if (response.ok) {
          setRooms(data);
        }
        else {
          console.error('Failed to fetch rooms');
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
  };


  useEffect(() => {
  const username = localStorage.getItem('username');
  setUsername(username);
  console.log(username)
  fetchRooms(username);
}, []); // ← Run only once


  return (
    //When this page gets clicked/refreshed maybe even auto refreshing when an event happens in the database
    //It will get a list of room assigned to the maid based on their login and then get a list of rooms they need to finish
    //Use a loop to go through all of those rooms and make a button for each room
    <div>
      Maid Dashboard
      {rooms.map((room) => (
        <div>{room.roomNum}
      <SwitchButton
      name='Start Room Clean' 
      secondname='Stop Room Clean'
      roomNum={room.roomNum} //Will become dynamic based on the room assigned to the maid when they log in
      onToggle={(on) => {
        if (on) {
        console.log("Send the current time to the database for the starting room clean in the logs table where we use the maids login credentials and the room attcahed to the button")
        } else {
          console.log("Send the current time to the database for the ending room clean in the logs table where we use the maids login credentials and the room attcahed to the button")
        }
      }}
      />
      </div>
      ))}
      
      </div>
  )
}

export default Dashboard