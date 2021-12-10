import engine from 'engine';
import Victor from 'victor';
import { drawTextOutline } from './index';
const { GLOBALS } = engine;
const Vector = Victor;

export const draw = (s, pl) => {
  // console.log("fviw", pl);
  let sg = s.game;
  let si = s.image;
  let sv = s.view;
  //update radius based on length
  let radius = pl.radius * 1.33;

  let parts = [];
  parts.push(new Vector(pl.pos.x, pl.pos.y));
  // console.log("sves", parts[0], pl);

  const bodySpacing = GLOBALS.snakeBodySpacing;
  // console.log("szos", pl.pointPathX.length);

  let i = 0;
  let k = 0;
  let posx = pl.pos.x;
  let posy = pl.pos.y;
  let space = 0;
  while(true) {
    if (i >= pl.pointPathX.length) break;
    let dx = pl.pointPathX[i] - posx;
    let dy = pl.pointPathY[i] - posy;
    let d = Math.sqrt(dx*dx + dy*dy);
    if(space + d < bodySpacing) {
      posx = pl.pointPathX[i];
      posy = pl.pointPathY[i];
      i++;
      space += d;
    } else {
      //proof sketch of lerp correctness:
      //space + d == bodySpacing => t = 1
      //space == bodySpacing => t = 0
      //space + t*d == bodySpacing
      //t == (bodySpacing - space)/d
      let t = (bodySpacing - space)/d;
      posx = t*dx + posx;
      posy = t*dy + posy;
      space = 0;

      parts.push(new Vector(posx, posy))
      k++;

      if(k >= pl.bodyPartCount - 1) break;
    }
  }
  if(k < pl.bodyPartCount - 1) {
    parts.push(new Vector(posx, posy))
  }


  //Grab player sprites
  // console.log("dfev", pl);
  const playerHead = si.sprites[`${pl.spriteName}Head`];
  const playerBodyFirst = si.sprites[`${pl.spriteName}Body-first`];
  let playerBody = si.sprites[`${pl.spriteName}Body`];
  //If no player body, the body is split into multiple sections
  if (!playerBody) {
    playerBody = [];
    //max of 4 sections and a "last" part currently
    for (let i=0; i<4; i++) {
      const nextSpriteRef = si.sprites[`${pl.spriteName}Body-${i}`];
      if (nextSpriteRef) {
        playerBody.push(nextSpriteRef)
      } else {
        break;
      }
    }
  }
  const playerBodyLast = si.sprites[`${pl.spriteName}Body-last`];

  const c = s.ctx;
  const snakeBodyRelativePositions = parts
    .map(partPos => sv.active?.getObjectRelativePosition(s, partPos, true));
  for (let i=snakeBodyRelativePositions.length-1; i>=0; i--) {
    const pos = snakeBodyRelativePositions[i];
    c.save();
    if (i === 0) {
      c.translate(pos.x, pos.y);
      drawTextOutline(
        s,
        pl.playerName,
        0,
        -1*(2.5+pl.radius)*sg.gu,
        `${(1.5*sg.gu)+4}px Arial`,
        "rgb(255, 255, 255)",
        "rgb(30, 30, 30)",
        0.75
      );
      c.rotate(pl.vel.horizontalAngle()+Math.PI/2);
      if(playerHead) playerHead.draw(
        s,
        c,
        -radius * sg.gu,
        -radius * sg.gu,
        radius * sg.gu * 2,
        radius * sg.gu * 2
      );
    } else if (i === 1 && playerBodyFirst) {
      c.translate(pos.x, pos.y);
      c.rotate(snakeBodyRelativePositions[i-1].clone().subtract(pos).horizontalAngle()+Math.PI/2);
      playerBodyFirst.draw(
        s,
        c,
        -radius * sg.gu,
        -radius * sg.gu,
        radius * sg.gu * 2,
        radius * sg.gu * 2
      );
    } else if (i === snakeBodyRelativePositions.length-1 && playerBodyLast) {
      c.translate(pos.x, pos.y);
      c.rotate(snakeBodyRelativePositions[i-1].clone().subtract(pos).horizontalAngle()+Math.PI/2);
      playerBodyLast.draw(
        s,
        c,
        -radius * sg.gu,
        -radius * sg.gu,
        radius * sg.gu * 2,
        radius * sg.gu * 2
      );
    } else {
      c.translate(pos.x, pos.y);
      c.rotate(snakeBodyRelativePositions[i-1].clone().subtract(pos).horizontalAngle()+Math.PI/2);
      let selectedSprite;
      if (playerBody instanceof Array) {
        if(playerBody.length > 0) {
          const spriteIndex = i % playerBody.length;
          selectedSprite = playerBody[spriteIndex];
        }
      } else {
        selectedSprite = playerBody;
      }
      if(selectedSprite) {
        selectedSprite.draw(
          s,
          c,
          -radius * sg.gu,
          -radius * sg.gu,
          radius * sg.gu * 2,
          radius * sg.gu * 2
        );
      }
    }
    c.restore();
  }
}
