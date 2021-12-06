import React, { useEffect, useRef, useState } from 'react';
import engine from 'engine';
import { io } from 'socket.io-client';
import { ClientState, CLIENT_STATES } from './clientState';
import { View } from './drawing/view';
import * as keys from './keys';
import * as socket from './socket';
import * as view from './drawing/view';
import * as drawing from './drawing';
import * as game from './game';
import * as levelLoader from './clientLevelLoader';
import * as playerController from './playerController';
const { time, physics } = engine;

const App = () => {
  const canvasRef = useRef(null);
  const nameInputRef = useRef(null);
  const [gameState, setStateInstance] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    try {
      const newSocket = io();
      const stateInstance = new ClientState(newSocket);
      stateInstance.game.connecting = true;
      setStateInstance(stateInstance);
      newSocket.on("connect", () => {
        stateInstance.game.connecting = false;
        setConnected(true);
      });
      newSocket.on("disconnect", () => {
        stateInstance.game.connecting = false;
        setConnected(false);
      });
    } catch (e) {
      console.error(e);
      setConnectionError(e);
    }
  }, []);
  
  //Init
  useEffect(() => {
    if (!connected) return;
    //Initialize all modules in no particular order
    game.init(gameState);
    keys.init(gameState);
    time.init(gameState);
    physics.init(gameState);
    socket.init(gameState);
    drawing.init(gameState);
    view.init(gameState);
    levelLoader.init(gameState);
    playerController.init(gameState);
    // scoring.init();
    // audio.init();
    const resizeListener = gameState.resize.bind(gameState);
    window.addEventListener("resize", resizeListener);
    return () => { window.removeEventListener("resize", resizeListener); }
  }, [gameState, connected]);
  
  //Start
  useEffect(() => {
    if (!canvasRef.current || !nameInputRef.current) return;
    gameState.setCanvas(canvasRef.current);
    gameState.setInput(nameInputRef.current);
    keys.start();
    physics.start();
    socket.start();
    drawing.start();
    levelLoader.start();
    gameState.view.active = new View(0, 0, 100, 100);
    gameState.game.numAssetsLoading = gameState.game.loading.length;
    
    //Bind blur/focus events to pause
    const handleBlurPause = () => {
      if (gameState.game.clientState === CLIENT_STATES.PLAYING) {
        gameState.game.clientState = CLIENT_STATES.PAUSED;
      }
    };
    const handleFocusPlay = () => {
      if (gameState.game.clientState === CLIENT_STATES.PAUSED) {
        gameState.game.clientState = CLIENT_STATES.PLAYING;
      }
    }
    const handleContextMenu = (e) => {
      e.preventDefault();
    }
    window.addEventListener('blur', handleBlurPause);
    window.addEventListener('focus', handleFocusPlay);
    window.addEventListener('contextmenu', handleContextMenu);
    
    //Finally, start the game loop
    game.start();
    
    //unbind events on unmount
    return () => {
      window.removeEventListener('blur', handleBlurPause);
      window.removeEventListener('focus', handleFocusPlay);
      window.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [canvasRef.current, nameInputRef.current, connected])

  if (connectionError) return (<div>{connectionError.message}</div>);
  if (!connected && gameState?.game.connecting) return (<div>loading</div>);
  if (!connected && !gameState?.game.connecting) return (<div>problem connecting to server</div>)

  return (
    <>
      <div id="input-wrapper">
        <input ref={nameInputRef} id="name-input" />
      </div>
      <div id="canvas-box">
        <canvas id="canvas" ref={canvasRef}>please enable javascript</canvas>
      </div>
    </>
  )
}

export default App;
