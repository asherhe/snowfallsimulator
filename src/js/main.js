/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

// buttons
let paused = false;
$("#pause").on("click", (e) => {
  paused = !paused;
  if (paused) {
    $("#pause").html('<i class="fa-solid fa-play"></i>');
    clearInterval(updateInterval);
  } else {
    $("#pause").html('<i class="fa-solid fa-pause"></i>');
    updateInterval = setInterval(tick, config.tickspeed);
  }
});
$("#slower").on("click", (e) => {
  setTickspeed(config.tickspeed * 2);
});
$("#faster").on("click", (e) => {
  setTickspeed(config.tickspeed / 2);
});
$("#restart").on("click", (e) => {
  snowGrid = makeGrid(canvas.width, canvas.height);
});
$("#snow-add").on("click", (e) => {
  config.snowflakes += 10;
  if (config.snowflakes > config.maxSnowflakes) config.snowflakes = config.maxSnowflakes;
});
$("#snow-sub").on("click", (e) => {
  config.snowflakes -= 10;
  if (config.snowflakes < config.minSnowflakes) config.snowflakes = config.minSnowflakes;
});
$("#obj-add").on("click", (e) => {
  // todo
});
$("#obj-sub").on("click", (e) => {
  // todo
});

let $container = $("#container");
let containerWidth = $container.innerWidth(),
  containerHeight = $container.innerHeight(),
  aspect = containerWidth / containerHeight;
function adjustSize() {
  let windowWidth = window.innerWidth,
    windowHeight = window.innerHeight;
  let winAspect = windowWidth / windowHeight;
  if (aspect < winAspect) {
    // too wide
    $container.css(
      "transform",
      `translate(${(windowWidth - containerWidth) / 2}px, ${(windowHeight - containerHeight) / 2}px) scale(${
        windowHeight / containerHeight
      })`
    );
  } else {
    // too narrow
    $container.css(
      "transform",
      `translate(${(windowWidth - containerWidth) / 2}px, ${(windowHeight - containerHeight) / 2}px) scale(${
        windowWidth / containerWidth
      })`
    );
  }
}
window.addEventListener("resize", adjustSize);
adjustSize();

const config = {
  tickspeed: 100, // simulation step in ms
  minTickspeed: 5,
  maxTickspeed: 2000,
  snowflakes: 10, // snowflakes per tick
  maxSnowflakes: 200,
  minSnowflakes: 0,
};

function makeGrid(width, height, val = 0) {
  return Array.apply(null, Array(width)).map(() => Array.apply(null, Array(height)).map(() => val));
}

let snowGrid = makeGrid(canvas.width, canvas.height);

// /** @type {{[keycode: number]: boolean}} */
// let keys = {};
// // register key presses
// $(document).on("keydown", (e) => {
//   keys[e.which] = true;
// });
// $(document).on("keyup", (e) => {
//   keys[e.which] = false;
// });

// /**
//  * @param {number} key key code of the key
//  * @returns {boolean}
//  */
// function isKeyDown(key) {
//   return keys[key] || false;
// }

const colors = {
  sky: [26, 24, 30],
  snow: [233, 239, 243],
};

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let imageData = ctx.createImageData(canvas.width, canvas.height);
  let data = imageData.data;

  let i = 0;
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++) {
      let col = colors.sky;
      if (snowGrid[x][y]) col = colors.snow;

      data[i] = col[0];
      data[i + 1] = col[1];
      data[i + 2] = col[2];
      data[i + 3] = col[3] || 255;

      i += 4;
    }

  ctx.putImageData(imageData, 0, 0);
}

// whether a pixel at (x, y) collides with anything
function collision(x, y) {
  x = Math.round(x);
  y = Math.round(y);

  // wall collisions
  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return true;

  // snow collisions
  if (snowGrid[x][y]) return true;

  return false;
}

// pixel traversal
// function traverse(x, y, dx, dy) {
//   let sgnDx = Math.sign(dx),
//     sgnDy = Math.sign(dy);

//   let slope = dy / dx;
//   let invSlope = dx / dy;

//   let nextXDx = (sgnDx == 1 ? Math.ceil(x) : Math.floor(x)) - x;
//   if (nextXDx == 0) nextXDx = 1;
//   let nextXDy = slope * nextXDx;

//   let nextYDy = (sgnDy == 1 ? Math.ceil(y) : Math.floor(y)) - y;
//   if (nextYDy == 0) nextYDy = 1;
//   let nextYDx = invSlope * nextYDy;

//   if (nextXDx < nextYDy) {
//     x += nextXDx;
//     y += nextXDy;
//     return { x: x, y: y, tileX: sgnDx == 1 ? x : x - 1, tileY: Math.floor(y) };
//   } else {
//     x += nextYDx;
//     y += nextYDy;
//     return { x: x, y: y, tileX: Math.floor(x), tileY: sgnDy == 1 ? y : y - 1 };
//   }
// }

function update() {
  // generate snowflakes
  for (let i = 0; i < config.snowflakes; i++) snowGrid[Math.floor(Math.random() * canvas.width)][0] = 1;

  // compute next simulation step
  let newSnowGrid = makeGrid(canvas.width, canvas.height);
  for (let x = 0; x < canvas.width; x++)
    for (let y = 0; y < canvas.height; y++) {
      if (snowGrid[x][y]) {
        if (collision(x, y + 1)) {
          // even out "towers"
          let dir = Math.floor(Math.random() * 2) * 2 - 1;
          if (!collision(x + dir, y + 1)) newSnowGrid[x + dir][y + 1] = 1;
          else if (!collision(x - dir, y + 1)) newSnowGrid[x - dir][y + 1] = 1;
          else newSnowGrid[x][y] = 1;
        } else {
          let dx = Math.floor(Math.random() * 3) - 1,
            dy = Math.floor(Math.random() * 3),
            newX = x + dx,
            newY = y + dy;

          if (!collision(newX, newY)) newSnowGrid[newX][newY] = 1;
          else if (!collision(x, newY)) newSnowGrid[x][newY] = 1;
          else if (!collision(newX, y)) newSnowGrid[newX][y] = 1;
          else newSnowGrid[x][y] = 1;
        }
      }
    }
  snowGrid = newSnowGrid;
}

function tick() {
  update();
  render();
}
let updateInterval = setInterval(tick, config.tickspeed);

function setTickspeed(ms) {
  if (config.minTickspeed <= ms && ms <= config.maxTickspeed) {
    config.tickspeed = ms;
    clearInterval(updateInterval);
    updateInterval = setInterval(tick, ms);
  }
}
