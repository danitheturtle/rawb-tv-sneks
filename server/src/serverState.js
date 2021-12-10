import engine from 'engine';
const { State, GAME_STATES } = engine;

export const SERVER_STATES = {
  ...GAME_STATES
}

export class ServerState extends State {
  constructor(_io) {
    super(_io);
  }
}
