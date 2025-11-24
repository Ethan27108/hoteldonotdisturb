import React, { useEffect, useState } from 'react'

const AlgoForce: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')

  const algosending = async (authToken?: string) => {
    const t = authToken ?? token
    if (!t) return

    try {
      const response = await fetch('/api/algoForced/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()
      if (response.ok) {
        console.log('Algorithm Forced Successfully')
        setStatus('Algorithm forced successfully')
      } else {
        console.error('Failed to force algorithm', data)
        setStatus('Failed to force algorithm')
      }
    } catch (error) {
      console.error('Error forcing algorithm:', error)
      setStatus('Error forcing algorithm')
    }
  }

  useEffect(() => {
    const localToken = localStorage.getItem('token')
    const localUsername = localStorage.getItem('username')
    setToken(localToken)
    setUsername(localUsername)

    if (localToken) {
      void algosending(localToken)
    }
  }, [])

  return (
    <div>
      <h3>Force Algorithm</h3>
      <p>User: {username ?? '—'}</p>
      <p>{status}</p>
    </div>
  )
}

export default AlgoForce