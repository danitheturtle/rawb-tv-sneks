const keys = {
  mouseButton: {
    pressed: false,
    keyDown: [],
    keyUp: []
  }
};
const scrollCallbacks = [];
const mouseMoveCallbacks = [];
let state, mouseCoords, isMouseDown;

export const init = (_state) => {
  state = _state;
  //Add an event listener for keydown
  window.addEventListener("keydown", function(e) {
    //If this key isn't in the object, create data for it
    if (typeof(keys[e.keyCode]) === "undefined") {
      keys[e.keyCode] = {
        pressed: true,
        keyDown: [],
        keyUp: []
      };
    } else {
      //Set the key to pressed
      keys[e.keyCode].pressed = true;
      //Loop and call all bound functions
      keys[e.keyCode].keyDown.forEach(cb => cb());
    }
  });

  //Add an event listener for keyup
  window.addEventListener("keyup", function(e) {
    //If this key isn't in the object, create data for it
    if (typeof(keys[e.keyCode]) === "undefined") {
      keys[e.keyCode] = {
        pressed: false,
        keyDown: [],
        keyUp: []
      };
    } else {
      //Set the key to not pressed
      keys[e.keyCode].pressed = false;
      //Loop and call all bound functions
      keys[e.keyCode].keyUp.forEach(cb => cb());
    }
  });

  //Add an event listener for mouse movement
  window.addEventListener("mousemove", function(e) {
    //Get the mouse position
    mouseCoords = [e.clientX, e.clientY];
    mouseMoveCallbacks.forEach(cb => cb(mouseCoords));
  });

  //Add an event listener for mouse wheel events
  window.addEventListener("wheel", function(e) {
    //Cross-browser compatible scroll delta
    let delta = e.wheelDelta != undefined ?
      e.wheelDelta :
      -1 * e.deltaY;
    //Loop through all callbacks
    scrollCallbacks.forEach(cb => cb(delta < 0 ? -1 : 1));
  });
}
/**
 * Bind mouse click events to canvas
 */
export const start = () => {
  state.canvas.addEventListener('mousedown', function() {
    keys.mouseButton.pressed = true;
    keys.mouseButton.keyDown.forEach((cb) => cb());
  });
  state.canvas.addEventListener('mouseup', function() {
    keys.mouseButton.pressed = false;
    keys.mouseButton.keyUp.forEach((cb) => cb());
  });
}

/**
 * Bind a function to one or more keys to be called when the key(s) is/are pressed.
 * Accepts char code or a string representing the key(s)
 * The first n arguments are keys to bind to
 * The last argument is the callback function
 */
export const keyDown = (...args) => {
  //Loop through every argument and add the callback to it
  for (let i = 0; i < args.length - 1; i++) {
    //Get the key code
    let keyCode = getKeyCode(args[i]);
    //If data does not exist for this key, create it
    if (typeof(keys[keyCode]) === "undefined") {
      keys[keyCode] = {
        pressed: false,
        keyDown: [],
        keyUp: []
      };
    }
    //Push the callback function to the array
    keys[keyCode].keyDown.push(args[args.length - 1]);
  }
}

/**
 * Bind a function to one or more keys to be called when the key(s) is/are released.
 * Accepts char code or a string representing the key(s)
 * The first n arguments are keys to bind to
 * The last argument is the callback function
 */
export const keyUp = (...args) => {
  //Loop through every argument and add the callback to it
  for (let i = 0; i < args.length - 1; i++) {
    //Get the key code
    let keyCode = getKeyCode(args[i]);
    //If data does not exist for this key, create it
    if (typeof(keys[keyCode]) === "undefined") {
      keys[keyCode] = {
        pressed: false,
        keyDown: [],
        keyUp: []
      };
    }
    //Push the callback function to the array
    keys[keyCode].keyUp.push(args[args.length - 1]);
  }
}

/**
 * Return whether a key is pressed
 * Accepts the char code or a string
 */
export const pressed = (key) => {
  //Get the key code
  let keyCode = getKeyCode(key);
  //If data does not exist for this key, create it
  if (typeof(keys[keyCode]) === "undefined") {
    keys[keyCode] = {
      pressed: false,
      keyDown: [],
      keyUp: []
    };
  }
  //Return whether or not the key is pressed
  return keys[keyCode].pressed;
}

/**
 * Binds a function to the mouse scrolling
 * an integer will be passed in to the function to determine direction
 */
export const scroll = callback => {
  scrollCallbacks.push(callback);
}

/**
 * Returns the numerical keycode given a string
 * Does nothing if an integer is passed
 * This only covers the most common keys.  More can be added easily by adding
 * their string to the switch statement
 */
export const getKeyCode = (key) => {
  if (key === 'mouseButton') return key;
  let keyCode = key;
  if (typeof key === 'string') {
    //This is probably inefficient
    switch (key) {
      case "=":
        keyCode = 187;
        break;
      case "+":
        keyCode = 187;
        break;
      case "-":
        keyCode = 189;
        break;
      case "up":
        keyCode = 38;
        break;
      case "down":
        keyCode = 40;
        break;
      case "left":
        keyCode = 37;
        break;
      case "right":
        keyCode = 39;
        break;
      case "space":
        keyCode = 32;
        break;
      case "shift":
        keyCode = 16;
        break;
      case "ctrl":
        keyCode = 17;
        break;
      case "alt":
        keyCode = 18;
        break;
      case "tab":
        keyCode = 9;
        break;
      case "enter":
        keyCode = 13;
        break;
      case "backspace":
        keyCode = 8;
        break;
      case "esc":
        keyCode = 27;
        break;
      case "del":
        keyCode = 46;
        break;
      case "ins":
        keyCode = 45;
        break;
      case "windows":
        keyCode = 91;
        break;
      default:
        keyCode = key.toUpperCase().charCodeAt(0);
        break;
    }
  }
  return keyCode;
}

export const mouse = () => {
  return mouseCoords;
}
