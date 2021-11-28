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
const { time, physics } = engine;

// useEffect(() => {
//   //Initialize all modules in no particular order
//   keys.init();
//   utils.init();
//   time.init();
//   image.init();
//   socket.init();
//   p.init();
//   scoring.init();
//   physics.init();
//   physObj.init();
//   playerUpdates.init();
//   levelLoader.init();
//   view.init();
//   particle.init();
//   audio.init();
// 
//   //Initialize the game
//   game.init();
// 
//   //Start the game (this will call start on the modules that need it)
//   game.start();
// 
//   //Store the total number of loading objects
//   app.state.game.numAssetsLoading = app.state.game.loading.length;
// 
//   //Wait for all asset loading promises to resolve, removing each as it does
//   //This is used by the client loading state to draw the load bar
//   for (let p = 0; p < app.state.game.loading.length; p++) {
//     app.state.game.loading[p].then(function() {
//       //delete the promise from the list
//       let index = app.state.game.loading.indexOf(this);
//       app.state.game.loading.splice(index, 1);
//     });
//   }
// 
//   //When onblur fires, pause the game (if the game is currently playing)
//   window.onblur = function() {
//     if (app.state.game.clientState == app.state.e.PLAYING) {
//       app.state.game.clientState = app.state.e.PAUSED;
//     }
//   }
// 
//   //When onfocus fires, unpause the game (if it was paused)
//   window.onfocus = function() {
//     if (app.state.game.clientState == app.state.e.PAUSED) {
//       app.state.game.clientState = app.state.e.PLAYING;
//     }
//   }
// }, [])

const App = () => {
  const canvasRef = useRef(null);
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
    // scoring.init();
    // playerUpdates.init();
    // audio.init();
    window.addEventListener("resize", gameState.resize);
    return () => { window.removeEventListener("resize", gameState.resize); }
  }, [gameState, connected]);
  
  //Start
  useEffect(() => {
    if (!canvasRef.current) return;
    gameState.setCanvas(canvasRef.current);
    gameState.resize();
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
    window.addEventListener('blur', handleBlurPause);
    window.addEventListener('focus', handleFocusPlay);
    
    
    //Finally, start the game loop
    game.start();
    
    //unbind events on unmount
    return () => {
      window.removeEventListener('blur', handleBlurPause);
      window.removeEventListener('focus', handleFocusPlay);
    }
  }, [canvasRef.current, connected])

  if (connectionError) return (<div>{connectionError.message}</div>);
  if (!connected && gameState?.game.connecting) return (<div>loading</div>);
  if (!connected && !gameState?.game.connecting) return (<div>problem connecting to server</div>)

  return (
    <div id="canvas-box">
      <canvas id="canvas" ref={canvasRef}>please enable javascript</canvas>
    </div>
  )
}

export default App;
