import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  useEffect(() => {
    try {
      const newSocket = io();
      newSocket.on("connect", () => {
        setConnected(true);
      });
      newSocket.on("disconnect", () => {
        setConnected(false);
      });
      setSocket(newSocket);
    } catch (e) {
      setConnectionError(e);
    }
  }, []);
  
  if (connectionError) return (<div>{connectionError.message}</div>);
  if (!socket?.connected) return (<div>loading</div>);
  
  return (
    <div>Testing! Is this thing on?</div>
  )
}

export default App;
