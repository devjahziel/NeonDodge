const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const gameOver = document.getElementById('game-over');
const playBtn = document.getElementById('play-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreVal = document.getElementById('score-val');
const levelVal = document.getElementById('level-val');
const finalScoreVal = document.getElementById('final-score-val');
const finalLevelVal = document.getElementById('final-level-val');

function resizeCanvas() {
  const wrapper = document.querySelector('.photo-wrap');
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const PLAYER_RADIUS = 10;
const PLAYER_SPEED = 5;
const POINTS_PER_LEVEL = 1000;
const SPEED_MULTIPLIER = 1.08;
const MAX_OBSTACLES = 10;

let gameState = 'menu';
let startTime = 0;
let score = 0;
let level = 1;

let player = { x: canvas.width / 2, y: canvas.height / 2, radius: PLAYER_RADIUS };

function generateInitialObstacles() {
  return [
    { centerX: canvas.width * 0.2, centerY: canvas.height * 0.2, orbitRadius: canvas.width * 0.12, speed: 0.0006, size: 40 },
    { centerX: canvas.width * 0.8, centerY: canvas.height * 0.2, orbitRadius: canvas.width * 0.13, speed: -0.0007, size: 42 },
    { centerX: canvas.width * 0.2, centerY: canvas.height * 0.8, orbitRadius: canvas.width * 0.12, speed: 0.0005, size: 38 },
    { centerX: canvas.width * 0.8, centerY: canvas.height * 0.8, orbitRadius: canvas.width * 0.11, speed: -0.0008, size: 45 },
    { centerX: canvas.width * 0.5, centerY: canvas.height * 0.15, orbitRadius: canvas.width * 0.1, speed: 0.00065, size: 35 },
    { centerX: canvas.width * 0.5, centerY: canvas.height * 0.85, orbitRadius: canvas.width * 0.09, speed: -0.00055, size: 40 }
  ];
}

let obstacles = [];

let particles = [];
function createParticles() {
  particles = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      speedY: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.3
    });
  }
}

const keys = {};
window.addEventListener('keydown', e => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault(); keys[e.key] = true; });
window.addEventListener('keyup', e => keys[e.key] = false);

let touchX = null;
let touchY = null;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  touchX = touch.clientX - rect.left;
  touchY = touch.clientY - rect.top;
});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  touchX = touch.clientX - rect.left;
  touchY = touch.clientY - rect.top;
});
canvas.addEventListener('touchend', () => {
  touchX = null;
  touchY = null;
});

function resetGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  obstacles = generateInitialObstacles();
  createParticles();
  score = 0; 
  level = 1;
  scoreVal.textContent = '0';
  levelVal.textContent = '1';
}

function startGame() {
  resetGame();
  hud.classList.remove('hidden');
  gameOver.classList.add('hidden');
  gameState = 'playing';
  startTime = performance.now();
  requestAnimationFrame(gameLoop);
}

restartBtn.addEventListener('click', startGame);
playBtn.addEventListener('click', startGame);

function gameLoop(ts) {
  if (gameState !== 'playing') return;
  const gameTime = (ts - startTime) / 1000;

  update(gameTime);
  draw(gameTime);

  requestAnimationFrame(gameLoop);
}

function update(gameTime) {
  score++;
  scoreVal.textContent = score;

  if (touchX !== null && touchY !== null) {
    const dx = touchX - player.x;
    const dy = touchY - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5) {
      player.x += (dx / dist) * PLAYER_SPEED;
      player.y += (dy / dist) * PLAYER_SPEED;
    }
  } else {
    if (keys['ArrowUp']) player.y -= PLAYER_SPEED;
    if (keys['ArrowDown']) player.y += PLAYER_SPEED;
    if (keys['ArrowLeft']) player.x -= PLAYER_SPEED;
    if (keys['ArrowRight']) player.x += PLAYER_SPEED;
  }

  player.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player.x));
  player.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player.y));

  const newLevel = Math.floor(score / POINTS_PER_LEVEL) + 1;
  if (newLevel > level && obstacles.length < MAX_OBSTACLES) {
    level = newLevel;
    levelVal.textContent = level;
    obstacles.forEach(o => o.speed *= SPEED_MULTIPLIER);
    obstacles.push({
      centerX: canvas.width * 0.2 + Math.random() * canvas.width * 0.6,
      centerY: canvas.height * 0.2 + Math.random() * canvas.height * 0.6,
      orbitRadius: canvas.width * 0.08 + (level * 0.01 * canvas.width),
      speed: (Math.random() > 0.5 ? 1 : -1) * 0.0005 * (1 + level * 0.1),
      size: 30 + (level * 2)
    });
  }

  for (let obs of obstacles) {
    const ox = obs.centerX + Math.cos(gameTime * obs.speed * 1000) * obs.orbitRadius;
    const oy = obs.centerY + Math.sin(gameTime * obs.speed * 1000) * obs.orbitRadius;
    const dist = Math.hypot(player.x - ox, player.y - oy);
    if (dist < player.radius + obs.size / 2) {
      finalScoreVal.textContent = score;
      finalLevelVal.textContent = level;
      hud.classList.add('hidden');
      gameOver.classList.remove('hidden');
      gameState = 'gameOver';
      return;
    }
  }
}

function draw(gameTime) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0f1a2e');
  grad.addColorStop(1, '#000811');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.y += p.speedY;
    if (p.y > canvas.height) p.y = -10;
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  for (let obs of obstacles) {
    const x = obs.centerX + Math.cos(gameTime * obs.speed * 1000) * obs.orbitRadius;
    const y = obs.centerY + Math.sin(gameTime * obs.speed * 1000) * obs.orbitRadius;

    ctx.save();
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 35;
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(x, y, obs.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

createParticles();
document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));