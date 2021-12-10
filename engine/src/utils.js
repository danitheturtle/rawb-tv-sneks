import Victor from 'victor';
const Vector = Victor;

export const norm = (value, min, max) => {
  return (value - min) / (max - min);
};

export const lerp = (norm, min, max) => {
  return (max - min) * norm + min;
}

export const lerpVec = (norm, v0, v1) => {
  const x = (v1.x - v0.x) * norm + v0.x;
  const y = (v1.y - v0.y) * norm + v0.y;
  return new Vector(x, y);
}

export const map = (value, sourceMin, sourceMax, destMin, destMax) => {
  const n = norm(value, sourceMin, sourceMax);
  return lerp(n, destMin, destMax);
}

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
}

export const inRads = (degr) => {
  return degr / 180 * Math.PI;
}

export const inDegr = (rads) => {
  return rads * 180 / Math.PI;
}

export const inRange = (value, min, max) => {
  return value >= Math.min(min, max) && value <= Math.max(min, max);
}

export const rangeIntersect = (min0, max0, min1, max1) => {
  return Math.max(min0, max0) >= Math.min(min1, max1) && Math.min(min0, max0) <= Math.min(min1, max1);
}

export const rangeContains = (min0, max0, min1, max1) => {
  return Math.max(min0, max0) >= Math.max(min1, max1) && Math.min(min0, max0) <= Math.min(min1, max1);
}

export const randomRange = (min, max) => {
  return min + Math.random()*(max - min);
}

export const randomInt = (min, max) => {
  return Math.floor(min + Math.random()*(max - min));
}

export const randomVec = () => {
  let vec = [
    randomRange(-1, 1),
    randomRange(-1, 1)
  ];
  let len = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
  if (len == 0) {
    vec = [1, 0];
    len = 1;
  }
  return new Vector(vec[0] / len, vec[1] / len);
}

export const randomRGB = () => {
  return "rgb(" + randomInt(0, 255) + "," + randomInt(0, 255) + "," + randomInt(0, 255) + ")";
}

export const randomRGBA = () => {
  return "rgba(" + randomInt(0, 255) + "," + randomInt(0, 255) + "," + randomInt(0, 255) + "," + randomRange(0.0, 1.0) + ")";
}

export const randomRGBOpacity = () => {
  return "rgba(" + randomInt(0, 255) + "," + randomInt(0, 255) + "," + randomInt(0, 255) + "," + clamp(opacity, 0.0, 1.0) + ")";
}
