import React from 'react'
import { useState } from 'react';




interface SwitchButttonProps {
  name: string;
  secondname: string;
  roomNum: number;
  onToggle?: (on: boolean) => void; // Add this prop
}


const SwitchButton: React.FC<SwitchButttonProps> = ({name,secondname, onToggle}) => {
    const [on, setOn] = useState(true);

    const handleClick = async () => {
    setOn(prevOn => {
      const newOn = !prevOn;
      if (onToggle) {
        onToggle(prevOn); // Call the parent function with the new state
      }
      return newOn;
    });
  };
  return(
    <button onClick={handleClick}>{on ? name : secondname}</button>
  )
}

export default SwitchButton