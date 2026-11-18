// Keyboard and mouse input. The game is played with WASD to move and the
// mouse to aim and fire, with Enter/Space and clicks for menus.
const held = new Set();
const pointer = { x: 0, y: 0, down: false, clicked: false };
const pressed = new Set();

export function attachInput(canvas) {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (!held.has(key)) pressed.add(key);
    held.add(key);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => held.delete(event.key.toLowerCase()));
  canvas.addEventListener('mousemove', (event) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width) * canvas.width;
    pointer.y = ((event.clientY - box.top) / box.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', () => {
    pointer.down = true;
    pointer.clicked = true;
  });
  window.addEventListener('mouseup', () => { pointer.down = false; });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
}

export function isDown(key) { return held.has(key); }
export function wasPressed(key) { return pressed.has(key); }
export function getPointer() { return pointer; }
export function consumeFrame() {
  pressed.clear();
  pointer.clicked = false;
}
export function clearHeld() { held.clear(); pressed.clear(); pointer.down = false; }
