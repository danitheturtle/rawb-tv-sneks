# SNEK IS HUNGRY. SNEK WILL C̶̖̑Ǒ̵͍N̶̳S̵̨̚Ư̴̧M̴̙E̵̐

This is a slither.io clone for rawb.tv so we can all play together and add lots of memes

_____
#### Running Locally
You'll need yarn 3. 

Duplicate `/env/.env` into files called `.env.development` and `.env.production`, letting you 
change version settings. By default, the dockerfile and prod server version are setup to use 
port `8080`, so edit that value into the `.env.production` file.

Then from the project root:
```
yarn install
yarn build
yarn start
```
Congrats! You can play snakey-mouse on `localhost:8080`. Every sub-project has its own
start/build script. Running /engine, /server, and /client in that order with `yarn start` will
get the dev build up and running with a webpack proxy.

To build a docker image, first run `yarn build`, then run this from the project root
```
docker build . -t snakey-mouse:v1
docker run --rm -it -p 80:8080 snakey-mouse:v1
```
That will get you a docker image, and start it running locally on port 80.
