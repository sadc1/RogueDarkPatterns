// Main Menu
const mainMenu = document.getElementById("mainMenu");
const gameWrapper = document.getElementById("gameWrapper");
const menuGreeting = document.getElementById("menuGreeting");
const startGameBtn = document.getElementById("startGameBtn");
const showLoginBtn = document.getElementById("showLoginBtn");
const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("nameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const cancelNameBtn = document.getElementById("cancelNameBtn");
const menuButtons = document.getElementById("menuButtons");

let playerName = localStorage.getItem("survivorPlayerName") || "Guest";
let gameStarted = false;

function updateMenuGreeting(){
  if(playerName && playerName !== "Guest"){
    menuGreeting.innerHTML = `Welcome back, <strong>${playerName}</strong>!`;
  }else{
    menuGreeting.innerHTML = `Welcome back, <strong>Guest</strong>!`;
  }
  const display = document.getElementById("playerNameDisplay");
  if(display) display.textContent = playerName;
}

showLoginBtn.addEventListener("click", () =>{
  nameForm.classList.remove("hidden");
  menuButtons.classList.add("hidden");
  nameInput.value = playerName === "Guest" ? "" : playerName;
  nameInput.focus();
});

cancelNameBtn.addEventListener("click", () =>{
  nameForm.classList.add("hidden");
  menuButtons.classList.remove("hidden");
});

saveNameBtn.addEventListener("click", () => {
  const entered = nameInput.value.trim();
  if(entered.length === 0 ){nameInput.focus(); return;}
  playerName = entered;
  localStorage.setItem("survivorPlayerName", playerName);
  updateMenuGreeting();
  nameForm.classList.add("hidden");
  menuButtons.classList.remove("hidden");
});
nameInput.addEventListener("keydown", (e) =>{
  if(e.key === "Enter") saveNameBtn.click();
  if(e.key === "Escape") cancelNameBtn.click();
});
startGameBtn.addEventListener("click", () => {
  mainMenu.classList.add("hidden");
  gameWrapper.classList.remove("hidden");
  if (!gameStarted) {
    gameStarted = true;
    resetGame();
    requestAnimationFrame(gameLoop);
  } else {
    resetGame();
  }
});
updateMenuGreeting();

// canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// hud
const healthStat = document.getElementById("healthStat");
const coinStat = document.getElementById("coinStat");
const roundStat = document.getElementById("roundStat");
const killStat = document.getElementById("killStat");

const attackStat = document.getElementById("attackStat");
const speedStat = document.getElementById("speedStat");
const critRateStat = document.getElementById("critRateStat");
const critDamageStat = document.getElementById("critDamageStat");

const enemyHealthInfo = document.getElementById("enemyHealthInfo");
const enemyAttackInfo = document.getElementById("enemyAttackInfo");
const enemySpeedInfo = document.getElementById("enemySpeedInfo");

const messageOverlay = document.getElementById("messageOverlay");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const resumeBtn = document.getElementById("resumeBtn");

const gameOverOverlay = document.getElementById("gameOverOverlay");
const finalSummary = document.getElementById("finalSummary");
const restartBtn = document.getElementById("restartBtn");
//tasks section added (carlos)
const tasks = document.getElementById("tasks");


// world size
const world = {
  width: 3200,
  height: 2200
};

// camera
const camera = {
  x: 0,
  y: 0
};

// game state
let keys = {};
let bullets = [];
let enemies = [];
let coins = [];
let particles = [];
let obstacles = [];

let round = 1;
let kills = 0;
let isPaused = false;
let betweenRounds = false;
let gameOver = false;

let roundTimer = 0;
let roundDuration = 28000;
let enemySpawnTimer = 0;
let lastTime = 0;

// player
let player = {
  x: world.width / 2,
  y: world.height / 2,
  radius: 16,
  health: 100,
  maxHealth: 100,
  attack: 12,
  speed: 3.5,
  maxSpeed: 6,
  critRate: 0.10,
  maxCritRate: 0.40,
  critDamage: 1.75,
  coins: 0,
  shootCooldown: 0,
  shootRate: 320,
  invulnTimer: 0,
  // regen health (carlos)
  regenRate: 1 / 1000,
  regenDelay: 2000,
  regenTimer:  0,
  regenAccum: 0
};



// tasks (carlos)

const taskPool = [
    {
        id:1,
        type:"kills",
        goal:15,
        reward: 50,
        description: "Get 15 kills"
    },
    {
    id: 2,
    type: "distance",
    goal: 1000,
    reward: 30,
    description: "Travel 1000 meters"
  },
  {
    id: 3,
    type: "kills",
    goal: 35,
    reward: 120,
    description: "Get 35 kills"
  },
  {
    id: 4,
    type: "distance",
    goal: 10000,
    reward: 80,
    description: "Travel 10000 meters"
  },
  {
    id: 5,
    type: "Collect Coins",
    goal: 15,
    reward: 150,
    description: "Collect coins 15 times"
  },
  {
    id: 6,
    type: "Collect Coins",
    goal: 30,
    reward: 300,
    description: "Collect coins 30 times"
  },
  {
    id: 7,
    type: "Survive Rounds",
    goal: 5,
    reward: 150,
    description: "Survive 5 rounds"
  },
  {
    id: 8,
    type: "Survive Rounds",
    goal: 10,
    reward: 300,
    description: "Survive 10 rounds"
  }
];

let activeTasks = [];

for(let i = 0; i < 3; i++){
    addNewTasks();
}

let playerStatsTracker = {
    kills: 0,
    coins: 0,
    coins_grabbed: 0,
    distance: 0,
    rounds_survived:0,
};

function addNewTasks(){
    if(activeTasks.length >= 3) return;
    const availableTasks = taskPool.filter(pooltask => 
        !activeTasks.some(active => active.id === pooltask.id)
    );

    if (availableTasks.length === 0) return;

    const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];

    activeTasks.push({...randomTask, progress:0});
    renderTasks();
}

function renderTasks() {
    tasks.innerHTML = "";

    for (const task of activeTasks) {
        const div = document.createElement("div");
        div.classList.add("task-card");
        div.innerHTML = `${task.description} (${task.progress}/${task.goal})
        <p>Reward: ${task.reward} coins<p>`;
        tasks.appendChild(div);
    }
}

function updateTasks(type, amount){
    activeTasks.forEach((task, index) => {
        if(task.type == type){
            task.progress += amount;

            if(task.progress >= task.goal){
                completeTask(index);
            }
        }
    });

    renderTasks();
}

function completeTask(index){
    const task = activeTasks[index];

    player.coins += task.reward;
    showCoinPopup(1300, 100, task.reward);
    playerStatsTracker.coins += task.reward;

    activeTasks.splice(index,1)

    addNewTasks();
}



// show amount of coins (carlos)
function showCoinPopup(x, y, amount) {
    const popup = document.createElement("div");
    popup.classList.add("coin-popup");
    popup.innerText = `+${amount}`;

    popup.style.left = x + "px";
    popup.style.top = y + "px";

    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 600);
}
// show regen health (carlos)
function showHealthRegenPopup(x, y, amount) {
    const popup = document.createElement("div");
    popup.classList.add("health-popup");
    popup.innerText = `+${amount}`;

    popup.style.left = x + "px";
    popup.style.top = y + "px";

    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 600);
}



//


// shop costs
let shopCosts = {
  health: 20,
  attack: 25,
  speed: 30,
  critRate: 35,
  critDamage: 40
};

// enemy scaling
function getEnemyStatsForRound(currentRound) {
  return {
    health: 24 + (currentRound - 1) * 8,
    attack: 6 + (currentRound - 1) * 1.5,
    speed: Math.min(1.2 + (currentRound - 1) * 0.16, 3.2),
    spawnDelay: Math.max(950 - (currentRound - 1) * 70, 320)
  };
}

// input
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "p" && !gameOver) {
    isPaused = !isPaused;
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// helpers
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function circleRectCollision(cx, cy, radius, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.width);
  const closestY = clamp(cy, rect.y, rect.y + rect.height);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < radius * radius;
}

function worldToScreen(x, y) {
  return {
    x: x - camera.x,
    y: y - camera.y
  };
}

function screenInView(x, y, padding = 100) {
  return (
    x >= -padding &&
    x <= canvas.width + padding &&
    y >= -padding &&
    y <= canvas.height + padding
  );
}

function updateCamera() {
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;

  camera.x = clamp(camera.x, 0, world.width - canvas.width);
  camera.y = clamp(camera.y, 0, world.height - canvas.height);
}

// world objects
function createObstacles() {
  obstacles = [
    { x: 350, y: 300, width: 100, height: 90, type: "crate" },
    { x: 700, y: 500, width: 130, height: 80, type: "rock" },
    { x: 1200, y: 250, width: 90, height: 140, type: "tree" },
    { x: 1500, y: 760, width: 150, height: 90, type: "car" },
    { x: 1850, y: 420, width: 90, height: 90, type: "barrel" },
    { x: 2200, y: 950, width: 110, height: 130, type: "tree" },
    { x: 2550, y: 600, width: 160, height: 70, type: "fence" },
    { x: 2750, y: 1200, width: 110, height: 110, type: "rock" },
    { x: 500, y: 1200, width: 150, height: 90, type: "crate" },
    { x: 930, y: 1400, width: 95, height: 140, type: "tree" },
    { x: 1300, y: 1200, width: 140, height: 65, type: "car" },
    { x: 1700, y: 1550, width: 150, height: 80, type: "fence" },
    { x: 2150, y: 1600, width: 90, height: 120, type: "barrel" },
    { x: 2500, y: 1700, width: 125, height: 125, type: "rock" },
    { x: 2900, y: 400, width: 85, height: 140, type: "tree" }
  ];
}

function randomSpawnAroundPlayer() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 420 + Math.random() * 220;

  let x = player.x + Math.cos(angle) * dist;
  let y = player.y + Math.sin(angle) * dist;

  x = clamp(x, 40, world.width - 40);
  y = clamp(y, 40, world.height - 40);

  return { x, y };
}

// reset
function resetGame() {
  bullets = [];
  enemies = [];
  coins = [];
  particles = [];
  keys = {};

  round = 1;
  kills = 0;
  isPaused = false;
  betweenRounds = false;
  gameOver = false;

  roundTimer = 0;
  enemySpawnTimer = 0;
  lastTime = 0;

  player = {
    x: world.width / 2,
    y: world.height / 2,
    radius: 16,
    health: 100,
    maxHealth: 100,
    attack: 12,
    speed: 3.5,
    maxSpeed: 6,
    critRate: 0.10,
    maxCritRate: 0.40,
    critDamage: 1.75,
    coins: 0,
    shootCooldown: 0,
    shootRate: 320,
    invulnTimer: 0,
    //regen health (carlos)
    regenRate: 1 / 1000,
    regenDelay: 2000,
    regenTimer: 0,
    regenAccum: 0
  };

  shopCosts = {
    health: 20,
    attack: 25,
    speed: 30,
    critRate: 35,
    critDamage: 40
  };

  createObstacles();
  hideOverlays();
  updateCamera();
  updateHUD();
  const subtitle = document.querySelector('.subtitle');
  subtitle.innerHTML = 'Move around the map, defeat enemies, collect coins, and upgrade stats. You don\'t want to die, do you?';
}

function hideOverlays() {
  messageOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
}

// round flow
function endRound() {
  betweenRounds = true;
  enemies = [];
  bullets = [];
  coins = [];

  messageTitle.textContent = `Round ${round} Complete`;
  messageText.textContent = "Use coins to upgrade, then start the next round.";
  messageOverlay.classList.remove("hidden");
}

function startNextRound() {
  betweenRounds = false;
  round += 1;
  roundTimer = 0;
  enemySpawnTimer = 0;
  messageOverlay.classList.add("hidden");
  updateHUD();
}

resumeBtn.addEventListener("click", () => {
  startNextRound();
});

restartBtn.addEventListener("click", () => {
  resetGame();
});
const backToMenuBtn = document.getElementById("backToMenuBtn");
backToMenuBtn.addEventListener("click", () => {
  gameWrapper.classList.add("hidden");
  mainMenu.classList.remove("hidden");
  updateMenuGreeting();
  resetGame();
})

// player movement
function updatePlayer(delta) {
  let moveX = 0;
  let moveY = 0;

  if (keys["w"] || keys["arrowup"]) moveY -= 1;
  if (keys["s"] || keys["arrowdown"]) moveY += 1;
  if (keys["a"] || keys["arrowleft"]) moveX -= 1;
  if (keys["d"] || keys["arrowright"]) moveX += 1;

  const length = Math.hypot(moveX, moveY);
  if (length > 0) {
    moveX /= length;
    moveY /= length;
  }

  const oldX = player.x;
  const oldY = player.y;

  player.x += moveX * player.speed * delta * 0.06;
  player.y += moveY * player.speed * delta * 0.06;

  player.x = clamp(player.x, player.radius, world.width - player.radius);
  player.y = clamp(player.y, player.radius, world.height - player.radius);

  for (const obstacle of obstacles) {
    if (circleRectCollision(player.x, player.y, player.radius, obstacle)) {
      player.x = oldX;
      player.y = oldY;
      break;
    }
  }


  //tracking distance for tasks (carlos)
  const dx = player.x - oldX;
  const dy = player.y - oldY;

  const distanceMoved = Math.hypot(dx, dy);

  playerStatsTracker.distance += distanceMoved;
  updateTasks("distance", Math.floor(distanceMoved));
  //


  if (player.invulnTimer > 0) player.invulnTimer -= delta;
  if (player.shootCooldown > 0) player.shootCooldown -= delta;

  //added health regen (carlos)
  player.regenTimer += delta;

  if (player.regenTimer >= player.regenDelay && player.health < player.maxHealth) {
    const healAmount = (1 / 1000) * delta;
    player.health += healAmount;
    player.health = Math.min(player.health, player.maxHealth);

    player.regenAccum += healAmount;
    if (player.regenAccum >= 1) {
      const healInt = Math.floor(player.regenAccum);
      player.regenAccum -= healInt;
      showHealthRegenPopup(1150, 100, healInt);
    }
  }
}

// auto shoot
function findNearestEnemy() {
  if (enemies.length === 0) return null;

  let nearest = enemies[0];
  let bestDistance = distance(player.x, player.y, nearest.x, nearest.y);

  for (let i = 1; i < enemies.length; i++) {
    const d = distance(player.x, player.y, enemies[i].x, enemies[i].y);
    if (d < bestDistance) {
      bestDistance = d;
      nearest = enemies[i];
    }
  }

  return nearest;
}

function shootAtNearestEnemy() {
  if (player.shootCooldown > 0 || enemies.length === 0) return;

  const target = findNearestEnemy();
  if (!target) return;

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const len = Math.hypot(dx, dy) || 1;

  bullets.push({
    x: player.x,
    y: player.y,
    radius: 5,
    vx: (dx / len) * 6.2,
    vy: (dy / len) * 6.2,
    damage: player.attack
  });

  player.shootCooldown = player.shootRate;
}

// enemies (updated more types of enemies - carlos)
function spawnEnemy() {
  const enemyStats = getEnemyStatsForRound(round);
  const spawn = randomSpawnAroundPlayer();

  for (const obstacle of obstacles) {
    if (circleRectCollision(spawn.x, spawn.y, 16, obstacle)) {
      return;
    }
  }
let enemy;

  if (round >= 5 && Math.random() < 0.3) {
    // FAST enemy (appears round 5+)
    enemy = {
      x: spawn.x,
      y: spawn.y,
      radius: 10,
      health: enemyStats.health * 0.7,
      maxHealth: enemyStats.health * 0.7,
      attack: enemyStats.attack * 0.8,
      speed: enemyStats.speed * 1.8,
      hitCooldown: 0,
      type: "fast"
    };

  } else if (round >= 10 && Math.random() < 0.2) {
    // TANK enemy (appears round 10+)
    enemy = {
      x: spawn.x,
      y: spawn.y,
      radius: 18,
      health: enemyStats.health * 2.2,
      maxHealth: enemyStats.health * 2.2,
      attack: enemyStats.attack * 1.5,
      speed: enemyStats.speed * 0.6,
      hitCooldown: 0,
      type: "tank"
    };

  } else {
    // NORMAL enemy
    enemy = {
      x: spawn.x,
      y: spawn.y,
      radius: 14,
      health: enemyStats.health,
      maxHealth: enemyStats.health,
      attack: enemyStats.attack,
      speed: enemyStats.speed,
      hitCooldown: 0,
      type: "normal"
    };
  }

  enemies.push(enemy);
}

function updateEnemies(delta) {
  for (let enemy of enemies) {
    const oldX = enemy.x;
    const oldY = enemy.y;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / len) * enemy.speed * delta * 0.03;
    enemy.y += (dy / len) * enemy.speed * delta * 0.03;

    for (const obstacle of obstacles) {
      if (circleRectCollision(enemy.x, enemy.y, enemy.radius, obstacle)) {
        enemy.x = oldX;
        enemy.y = oldY;
        break;
      }
    }

    if (enemy.hitCooldown > 0) enemy.hitCooldown -= delta;

    const touching = distance(player.x, player.y, enemy.x, enemy.y) < player.radius + enemy.radius;

    if (touching && enemy.hitCooldown <= 0 && player.invulnTimer <= 0) {
      player.health -= enemy.attack;
      player.regenTimer = 0;
      enemy.hitCooldown = 700;
      player.invulnTimer = 450;

      if (player.health <= 0) {
        player.health = 0;
        triggerGameOver();
      }
    }
  }
}

// bullets
function updateBullets(delta) {
  for (let bullet of bullets) {
    bullet.x += bullet.vx * delta * 0.06;
    bullet.y += bullet.vy * delta * 0.06;
  }

  bullets = bullets.filter((b) => {
    if (b.x < -20 || b.x > world.width + 20 || b.y < -20 || b.y > world.height + 20) {
      return false;
    }

    for (const obstacle of obstacles) {
      if (circleRectCollision(b.x, b.y, b.radius, obstacle)) {
        return false;
      }
    }

    return true;
  });
}

function handleBulletEnemyCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    let removed = false;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];

      if (distance(bullet.x, bullet.y, enemy.x, enemy.y) < bullet.radius + enemy.radius) {
        let damage = bullet.damage;
        const isCrit = Math.random() < player.critRate;

        if (isCrit) {
          damage *= player.critDamage;
        }

        enemy.health -= damage;
        bullets.splice(i, 1);
        removed = true;

        if (enemy.health <= 0) {
          kills += 1;

          // added for tracker(Carlos)
          playerStatsTracker.kills += 1;
          updateTasks("kills", 1);
          //

          const coinAmount = 4 + Math.floor(Math.random() * 4);
          coins.push({
            x: enemy.x,
            y: enemy.y,
            radius: 8,
            value: coinAmount
          });

          particles.push({
            x: enemy.x,
            y: enemy.y,
            life: 400
          });

          enemies.splice(j, 1);
        }

        break;
      }
    }

    if (removed) continue;
  }
}

// coins
function updateCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];

    if (distance(player.x, player.y, coin.x, coin.y) < player.radius + coin.radius) {
      player.coins += coin.value;
      //coin tracker for value and amount (carlos)
      playerStatsTracker.coins += coin.value;
      playerStatsTracker.coins_grabbed ++;
      updateTasks("Collect Coins", 1);
      showCoinPopup(1300, 100, coin.value);
      //
      coins.splice(i, 1);
    }
  }
}

// particles
function updateParticles(delta) {
  for (let p of particles) {
    p.life -= delta;
  }

  particles = particles.filter((p) => p.life > 0);
}

// shop
function tryBuyUpgrade(type) {
  const cost = shopCosts[type];
  if (player.coins < cost || gameOver) return;

  if (type === "health") {
    player.coins -= cost;
    player.maxHealth += 15;
    player.health = Math.min(player.health + 15, player.maxHealth);
    shopCosts.health += 12;
  }

  if (type === "attack") {
    player.coins -= cost;
    player.attack += 4;
    shopCosts.attack += 14;
  }

  if (type === "speed") {
    if (player.speed >= player.maxSpeed) return;
    player.coins -= cost;
    player.speed = Math.min(player.speed + 0.35, player.maxSpeed);
    shopCosts.speed += 16;
  }

  if (type === "critRate") {
    if (player.critRate >= player.maxCritRate) return;
    player.coins -= cost;
    player.critRate = Math.min(player.critRate + 0.03, player.maxCritRate);
    shopCosts.critRate += 18;
  }

  if (type === "critDamage") {
    player.coins -= cost;
    player.critDamage += 0.15;
    shopCosts.critDamage += 20;
  }

  updateHUD();
}

document.querySelectorAll(".shop-btn").forEach((button) => {
  button.addEventListener("click", () => {
    tryBuyUpgrade(button.dataset.upgrade);
  });
});

// game over
function triggerGameOver() {
  gameOver = true;
  finalSummary.textContent = `You reached round ${round}, got ${playerStatsTracker.kills} kills, and collected ${playerStatsTracker.coins} coins.${round < 5 ? ' You died, try doing more tasks, like the best players do.' : ''}`;
  gameOverOverlay.classList.remove("hidden");
  //Final debrief screen
  const subtitle = document.querySelector('.subtitle');
  subtitle.innerHTML = '<strong>The manipulative elements used are the gold despawning per round for pressuring the user to kill as many NPCs as possible, the top leaderboard system messages influencing users to act certain ways, the static task header stating there is a scarcity of them, etc. All urge a user to pursue a certain style of gameplay.</strong>';
}

// hud
function updateHUD() {
  healthStat.textContent = `${Math.ceil(player.health)} / ${Math.ceil(player.maxHealth)}`;
  coinStat.textContent = player.coins;
  roundStat.textContent = round;
  killStat.textContent = kills;

  attackStat.textContent = player.attack;
  speedStat.textContent = player.speed.toFixed(2);
  critRateStat.textContent = `${Math.round(player.critRate * 100)}%`;
  critDamageStat.textContent = `${Math.round(player.critDamage * 100)}%`;

  const e = getEnemyStatsForRound(round);
  enemyHealthInfo.textContent = Math.round(e.health);
  enemyAttackInfo.textContent = Math.round(e.attack * 10) / 10;
  enemySpeedInfo.textContent = e.speed.toFixed(2);

  document.getElementById("healthCost").textContent = `${shopCosts.health} coins`;
  document.getElementById("attackCost").textContent = `${shopCosts.attack} coins`;
  document.getElementById("speedCost").textContent = `${shopCosts.speed} coins`;
  document.getElementById("critRateCost").textContent = `${shopCosts.critRate} coins`;
  document.getElementById("critDamageCost").textContent = `${shopCosts.critDamage} coins`;
}

// draw map
function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#162032";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tileSize = 80;

  for (let x = 0; x < world.width; x += tileSize) {
    for (let y = 0; y < world.height; y += tileSize) {
      const screen = worldToScreen(x, y);

      if (!screenInView(screen.x, screen.y, tileSize)) continue;

      const dark = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = dark ? "#18263a" : "#1b2b41";
      ctx.fillRect(screen.x, screen.y, tileSize, tileSize);
    }
  }

  const topLeft = worldToScreen(0, 0);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 6;
  ctx.strokeRect(topLeft.x, topLeft.y, world.width, world.height);

  // reset so health bars draw correctly
  ctx.lineWidth = 1;
}

// draw obstacles
function drawObstacles() {
  for (const obstacle of obstacles) {
    const screen = worldToScreen(obstacle.x, obstacle.y);
    if (!screenInView(screen.x, screen.y, 180)) continue;

    if (obstacle.type === "crate") {
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(screen.x, screen.y, obstacle.width, obstacle.height);
      ctx.strokeStyle = "#5b3a1a";
      ctx.strokeRect(screen.x, screen.y, obstacle.width, obstacle.height);
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y);
      ctx.lineTo(screen.x + obstacle.width, screen.y + obstacle.height);
      ctx.moveTo(screen.x + obstacle.width, screen.y);
      ctx.lineTo(screen.x, screen.y + obstacle.height);
      ctx.stroke();
    }

    if (obstacle.type === "rock") {
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.ellipse(
        screen.x + obstacle.width / 2,
        screen.y + obstacle.height / 2,
        obstacle.width / 2,
        obstacle.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (obstacle.type === "tree") {
      ctx.fillStyle = "#5b3a1e";
      ctx.fillRect(
        screen.x + obstacle.width * 0.4,
        screen.y + obstacle.height * 0.55,
        obstacle.width * 0.2,
        obstacle.height * 0.45
      );
      ctx.fillStyle = "#1f7a3d";
      ctx.beginPath();
      ctx.arc(
        screen.x + obstacle.width / 2,
        screen.y + obstacle.height * 0.38,
        obstacle.width * 0.42,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (obstacle.type === "car") {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(screen.x, screen.y + obstacle.height * 0.15, obstacle.width, obstacle.height * 0.7);
      ctx.fillStyle = "#93c5fd";
      ctx.fillRect(screen.x + obstacle.width * 0.2, screen.y + obstacle.height * 0.28, obstacle.width * 0.25, obstacle.height * 0.22);
      ctx.fillRect(screen.x + obstacle.width * 0.55, screen.y + obstacle.height * 0.28, obstacle.width * 0.25, obstacle.height * 0.22);
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(screen.x + obstacle.width * 0.2, screen.y + obstacle.height * 0.88, 10, 0, Math.PI * 2);
      ctx.arc(screen.x + obstacle.width * 0.8, screen.y + obstacle.height * 0.88, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    if (obstacle.type === "barrel") {
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(screen.x, screen.y, obstacle.width, obstacle.height);
      ctx.strokeStyle = "#92400e";
      ctx.strokeRect(screen.x, screen.y, obstacle.width, obstacle.height);
      ctx.beginPath();
      ctx.moveTo(screen.x, screen.y + obstacle.height * 0.3);
      ctx.lineTo(screen.x + obstacle.width, screen.y + obstacle.height * 0.3);
      ctx.moveTo(screen.x, screen.y + obstacle.height * 0.7);
      ctx.lineTo(screen.x + obstacle.width, screen.y + obstacle.height * 0.7);
      ctx.stroke();
    }

    if (obstacle.type === "fence") {
      ctx.fillStyle = "#a16207";
      ctx.fillRect(screen.x, screen.y, obstacle.width, obstacle.height);
      ctx.strokeStyle = "#713f12";
      for (let i = 0; i < obstacle.width; i += 18) {
        ctx.strokeRect(screen.x + i, screen.y, 10, obstacle.height);
      }
    }
  }
}

// draw player
function drawPlayer() {
  const screen = worldToScreen(player.x, player.y);

  ctx.beginPath();
  ctx.fillStyle = player.invulnTimer > 0 ? "#fca5a5" : "#60a5fa";
  ctx.arc(screen.x, screen.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  const barWidth = 44;
  const barHeight = 5;

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(
    screen.x - 22,
    screen.y - 28,
    barWidth * (player.health / player.maxHealth),
    barHeight
  );

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#cbd5e1";
  ctx.strokeRect(screen.x - 22, screen.y - 28, barWidth, barHeight);
}

// draw enemies (updated for more enemies- carlos)
function drawEnemies() {
  for (let enemy of enemies) {
    const screen = worldToScreen(enemy.x, enemy.y);
    if (!screenInView(screen.x, screen.y, 40)) continue;

    ctx.beginPath();
    if (enemy.type === "fast") {
      ctx.fillStyle = "#22c55e"; // green
    } else if (enemy.type === "tank") {
      ctx.fillStyle = "#7c3aed"; // purple
    } else {
      ctx.fillStyle = "#ef4444"; // normal red
    }
    ctx.arc(screen.x, screen.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    const barWidth = 32;
    const barHeight = 4;

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(
      screen.x - 16,
      screen.y - 20,
      barWidth * (enemy.health / enemy.maxHealth),
      barHeight
    );

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fca5a5";
    ctx.strokeRect(screen.x - 16, screen.y - 20, barWidth, barHeight);
  }
}

// draw bullets
function drawBullets() {
  for (let bullet of bullets) {
    const screen = worldToScreen(bullet.x, bullet.y);
    if (!screenInView(screen.x, screen.y, 20)) continue;

    ctx.beginPath();
    ctx.fillStyle = "#fde68a";
    ctx.arc(screen.x, screen.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// draw coins
function drawCoins() {
  for (let coin of coins) {
    const screen = worldToScreen(coin.x, coin.y);
    if (!screenInView(screen.x, screen.y, 20)) continue;

    ctx.beginPath();
    ctx.fillStyle = "#facc15";
    ctx.arc(screen.x, screen.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// draw particles
function drawParticles() {
  for (let p of particles) {
    const screen = worldToScreen(p.x, p.y);
    if (!screenInView(screen.x, screen.y, 20)) continue;

    ctx.beginPath();
    ctx.fillStyle = `rgba(250, 204, 21, ${p.life / 400})`;
    ctx.arc(screen.x, screen.y, 12 - p.life / 80, 0, Math.PI * 2);
    ctx.fill();
  }
}

// draw text
function drawHudTextOnCanvas() {
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "16px Arial";
  ctx.fillText(`Round ${round}`, 16, 28);

  const secondsLeft = Math.max(0, Math.ceil((roundDuration - roundTimer) / 1000));
  ctx.fillText(`Time Left: ${secondsLeft}s`, 16, 50);

  ctx.fillText(`Map: ${Math.floor(player.x)}, ${Math.floor(player.y)}`, 16, 72);

  if (isPaused && !gameOver) {
    ctx.font = "bold 34px Arial";
    ctx.fillText("Paused", canvas.width / 2 - 56, canvas.height / 2);
  }

  if (betweenRounds) {
    ctx.font = "bold 30px Arial";
    ctx.fillText("Upgrade Time", canvas.width / 2 - 95, canvas.height / 2 - 110);
  }
}

// main loop
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (!isPaused && !betweenRounds && !gameOver) {
    roundTimer += delta;
    enemySpawnTimer += delta;

    const currentEnemyStats = getEnemyStatsForRound(round);

    if (enemySpawnTimer >= currentEnemyStats.spawnDelay) {
      spawnEnemy();
      enemySpawnTimer = 0;
    }

    if (roundTimer >= roundDuration) {
      //survive rounds task (carlos)
      playerStatsTracker.rounds_survived++;
      updateTasks("Survive Rounds", 1);
      //
      endRound();
      roundTimer = 0;
    }

    updatePlayer(delta);
    shootAtNearestEnemy();
    updateBullets(delta);
    updateEnemies(delta);
    handleBulletEnemyCollisions();
    updateCoins();
    updateParticles(delta);
  }

  updateCamera();
  updateHUD();

  drawBackground();
  drawObstacles();
  drawCoins();
  drawBullets();
  drawEnemies();
  drawParticles();
  drawPlayer();
  drawHudTextOnCanvas();

  requestAnimationFrame(gameLoop);
}

// start
//resetGame();
//requestAnimationFrame(gameLoop);