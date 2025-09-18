import React from 'react'
import { useState } from 'react';




interface SwitchButttonProps {
  name: string;
  secondname: string
}


const SwitchButton: React.FC<SwitchButttonProps> = ({name,secondname}) => {
    const [on, seton] = useState(true);

    const handleClick = async () => {
    if (on) {
        seton(false);
    } else {
      seton(true);
    }
  };
  return(
    <button onClick={handleClick}>{on ? name : secondname}</button>
  )
}

export default SwitchButton