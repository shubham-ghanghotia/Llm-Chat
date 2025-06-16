import React from 'react'
import ChatGPTClone from './ChatGPTClone'
import { SocketProvider } from './hooks/SocketProvider'

function App() {
  return (
    <SocketProvider>
      <ChatGPTClone />
    </SocketProvider>
  )
}

export default React.memo(App)