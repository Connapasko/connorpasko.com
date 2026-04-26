const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const waveEl = document.getElementById("wave");

const keys = {};

let score = 0;
let lives = 3;
let wave = 1;
let gameOver = false;
let enemyDirection = 1;
let lastShot = 0;
let hue = 0;
let flash = 0;
let shake = 0;

const player = {
  x: canvas.width / 2 - 22,
  y: canvas.height - 58,
  w: 44,
  h: 22,
  speed: 6,
};

let bullets = [];
let enemies = [];

function createEnemies() {
  enemies = [];

  const rows = Math.min(4 + Math.floor((wave - 1) / 2), 6);
  const cols = Math.min(9 + Math.floor((wave - 1) / 3), 11);
  const startX = 130;
  const startY = 70;
  const gapX = 72;
  const gapY = 48;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      enemies.push({
        x: startX + col * gapX,
        y: startY + row * gapY,
        w: 34,
        h: 24,
        alive: true,
        offset: Math.random() * 360,
      });
    }
  }
}

function resetGame() {
  score = 0;
  lives = 3;
  wave = 1;
  gameOver = false;
  enemyDirection = 1;
  bullets = [];
  player.speed = 6;
  player.x = canvas.width / 2 - player.w / 2;
  createEnemies();
  updateStats();
}

function updateStats() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  waveEl.textContent = wave;
}

function drawStars() {
  for (let i = 0; i < 95; i++) {
    const x = (i * 137 + performance.now() * 0.05) % canvas.width;
    const y = (i * 73 + performance.now() * 0.12) % canvas.height;
    const size = i % 7 === 0 ? 2.5 : 1.4;
    const color = `hsl(${(hue + i * 18) % 360}, 100%, 70%)`;

    ctx.fillStyle = color;
    ctx.globalAlpha = i % 5 === 0 ? 0.9 : 0.45;
    ctx.fillRect(x, y, size, size);
  }

  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const color = `hsl(${(hue + 250) % 360}, 100%, 68%)`;

  ctx.shadowColor = color;
  ctx.shadowBlur = 18;

  ctx.fillStyle = color;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + 17, player.y - 10, 10, 10);

  ctx.fillStyle = "#00f5ff";
  ctx.fillRect(player.x + 8, player.y + player.h, 28, 5);

  ctx.shadowBlur = 0;
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;

    const pulse = Math.sin(performance.now() * 0.006 + enemy.offset) * 5;
    const color = `hsl(${(hue + enemy.offset + enemy.x) % 360}, 100%, ${58 + pulse}%)`;

    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    ctx.fillStyle = color;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

    ctx.fillStyle = "#050509";
    ctx.fillRect(enemy.x + 7, enemy.y + 7, 5, 5);
    ctx.fillRect(enemy.x + 22, enemy.y + 7, 5, 5);

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.75;
    ctx.fillRect(enemy.x + 4, enemy.y - 4, 6, 4);
    ctx.fillRect(enemy.x + 24, enemy.y - 4, 6, 4);
    ctx.globalAlpha = 1;

    ctx.shadowBlur = 0;
  });
}

function drawBullets() {
  bullets.forEach((bullet) => {
    const color = `hsl(${(hue + bullet.y * 0.9) % 360}, 100%, 72%)`;

    ctx.shadowColor = color;
    ctx.shadowBlur = 18;

    ctx.fillStyle = color;
    ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bullet.x + 1, bullet.y, 2, bullet.h);

    ctx.shadowBlur = 0;
  });
}

function shoot() {
  const now = performance.now();

  if (now - lastShot < 210) return;

  bullets.push({
    x: player.x + player.w / 2 - 2,
    y: player.y - 12,
    w: 4,
    h: 14,
    speed: 8.5,
  });

  lastShot = now;
}

function updatePlayer() {
  if (keys.ArrowLeft || keys.a || keys.A) {
    player.x -= player.speed;
  }

  if (keys.ArrowRight || keys.d || keys.D) {
    player.x += player.speed;
  }

  player.x = Math.max(12, Math.min(canvas.width - player.w - 12, player.x));

  if (keys[" "]) {
    shoot();
  }
}

function updateBullets() {
  bullets.forEach((bullet) => {
    bullet.y -= bullet.speed;
  });

  bullets = bullets.filter((bullet) => bullet.y + bullet.h > 0);
}

function updateEnemies() {
  let shouldDrop = false;

  const aliveCount = enemies.filter((enemy) => enemy.alive).length;
  const speedBoost = 1 + (1 - aliveCount / enemies.length) * 2;
  const waveBoost = 1 + (wave - 1) * 0.18;
  const wobble = Math.sin(performance.now() * 0.004) * 0.35;

  enemies.forEach((enemy) => {
    if (!enemy.alive) return;

    enemy.x += enemyDirection * (0.75 + wobble) * speedBoost * waveBoost;

    if (enemy.x < 24 || enemy.x + enemy.w > canvas.width - 24) {
      shouldDrop = true;
    }
  });

  if (shouldDrop) {
    enemyDirection *= -1;

    enemies.forEach((enemy) => {
      enemy.y += 18 + wave * 2 + score / 350;
    });

    shake = 8;
  }

  enemies.forEach((enemy) => {
    if (enemy.alive && enemy.y + enemy.h >= player.y) {
      loseLife();
    }
  });
}

function checkCollisions() {
  bullets.forEach((bullet) => {
    enemies.forEach((enemy) => {
      if (!enemy.alive) return;

      const hit =
        bullet.x < enemy.x + enemy.w &&
        bullet.x + bullet.w > enemy.x &&
        bullet.y < enemy.y + enemy.h &&
        bullet.y + bullet.h > enemy.y;

      if (hit) {
        enemy.alive = false;
        bullet.y = -999;
        score += 10;
        flash = 5;
        shake = 5;
        updateStats();
      }
    });
  });

  if (enemies.every((enemy) => !enemy.alive)) {
    wave++;
    createEnemies();
    enemyDirection = enemyDirection < 0 ? -1 : 1;
    player.speed += 0.2;
    updateStats();
  }
}

function loseLife() {
  lives--;
  updateStats();

  flash = 12;
  shake = 16;

  if (lives <= 0) {
    gameOver = true;
  } else {
    bullets = [];
    createEnemies();
  }
}

function drawFlash() {
  if (flash <= 0) return;

  ctx.fillStyle = `hsla(${hue % 360}, 100%, 70%, ${flash / 28})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  flash--;
}

function drawScanlines() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)";

  for (let y = 0; y < canvas.height; y += 6) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
}

function drawGameOver() {
  ctx.fillStyle = "rgba(5,5,9,0.78)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 44px Inter, system-ui";
  ctx.textAlign = "center";
  ctx.shadowColor = `hsl(${hue % 360}, 100%, 65%)`;
  ctx.shadowBlur = 24;
  ctx.fillText("SYSTEM OVERRUN", canvas.width / 2, canvas.height / 2 - 20);

  ctx.fillStyle = "#00f5ff";
  ctx.font = "800 18px Inter, system-ui";
  ctx.fillText("Press Enter to restart", canvas.width / 2, canvas.height / 2 + 28);

  ctx.shadowBlur = 0;
}

function loop() {
  hue += 1.8;

  ctx.save();

  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    shake *= 0.86;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStars();

  if (!gameOver) {
    updatePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();
  }

  drawEnemies();
  drawBullets();
  drawPlayer();
  drawFlash();
  drawScanlines();

  if (gameOver) {
    drawGameOver();
  }

  ctx.restore();

  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;

  if (event.key === "Enter" && gameOver) {
    resetGame();
  }

  if (event.key === " ") {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

resetGame();
loop();
