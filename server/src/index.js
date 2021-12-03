import _ from 'environmentVars';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import axios from 'axios';
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
    socket.clientId = game.addNewPlayer(socket, clientPlayerData);
  
    //Listen to player updates from the client
    socket.on('updatePlayer', (data) => {
      game.updatePlayerFromClient(socket, data);
    });
    
    //Listen for a reset game call for debugging
    socket.on('reset', (clientId) => {
      game.reset(clientId);
    });
  
    //Only bind disconnect if the player was created in the first place
    //Disconnect the player
    socket.on('disconnect', () => {
      game.disconnectPlayer(socket.clientId);
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

const handleException = async (err, a) => {
	console.error(err.stack);
	try {
		const shutdown = new Promise((resolve) => server.close(resolve));
		const timeout = new Promise((resolve) => setTimeout(resolve, 1000));
		const discord = axios({
			method: "POST",
			url: process.env["CRASHREPORT_WEBHOOK"],
			headers: {
				"Content-Type": "application/json",
			},
			data: JSON.stringify({
				content: "**SNAKEY MOUSE CRASHED**\n<@138345057072840704>```json\n" + err.stack + "\n```",
			}),
		}).then(() => console.log("sent crash report"));
		await Promise.all([discord, Promise.race([shutdown, timeout])]);
	} catch (e) {
		console.error("Couldn't send to discord:", e);
		try {
			writeFileSync(`/errors/${new Date().toISOString()}.txt`, JSON.stringify(err.stack, null, 2));
		} finally {
			process.exit(1);
		}
	}
	process.exit(1);
};

process.on("uncaughtException", handleException);
process.on("unhandledRejection", handleException);