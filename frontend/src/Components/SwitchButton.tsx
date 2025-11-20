import React, { useState, useEffect } from 'react'

interface SwitchButtonProps {
  name: string
  secondname: string
  roomNum: number
  onToggle?: (on: boolean) => void
  initialOn?: boolean   // <-- NEW PROP
}

const SwitchButton: React.FC<SwitchButtonProps> = ({
  name,
  secondname,
  onToggle,
  initialOn = true,   // default OFF unless defined
}) => {

  const [on, setOn] = useState(initialOn)

  // If the parent updates initialOn, update the toggle
  useEffect(() => {
    setOn(initialOn)
  }, [initialOn])

  const handleClick = () => {
    setOn(prev => {
      const newState = !prev
      if (onToggle) onToggle(prev)   // <-- send *new* state
      return newState
    })
  }

  return (
    <button onClick={handleClick}>
      {on ? name : secondname}
    </button>
  )
}

export default SwitchButton
