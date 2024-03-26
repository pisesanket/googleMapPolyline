import { useState } from 'react'

import './App.css'
import MapLocation from './mapLocation'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <MapLocation/>
    </>
  )
}

export default App
