import _ from 'environmentVars';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import router from './router';
import * as game from './game';

//Express app
let app = express();
//HTTP servver
let server = http.createServer(app);
//Socket server
let io = new Server(server);

//Hook in the app router
app.use(router);

if (process.env.APP_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, "../client")));
} else {
  app.use(express.static(path.resolve(__dirname, "../../dist/client")))
}

//On a new player connection
io.on('connection', (socket) => {
  //Bind createNewPlayer for when the client requests a player
  socket.on('createNewPlayer', (clientPlayerData) => {
    //Add a new player to the game and store the ID on this socket
    socket.playerID = game.addNewPlayer(socket, clientPlayerData);
  
    //Listen to player updates from the client
    socket.on('updatePlayer', (data) => {
      game.updatePlayerFromClient(socket, data);
    });
  
    //Only bind disconnect if the player was created in the first place
    //Disconnect the player
    socket.on('disconnect', () => {
      game.disconnectPlayer(socket.playerID);
    });
  });
});

//Select the port from an environment variable or default to 8000
//This is needed for Heroku
let port = process.env.SERVER_PORT || 8000;

//Start the server listening on this port
server.listen(port, () => {
  console.log("Server listening on " + server.address().port);
  //Initialize the game.  Pass in our socket server instance
  game.init(io);
  game.start();
  //Start the game loop
  game.updateGame();
  //Start the network loop
  game.updateNetwork();
});
