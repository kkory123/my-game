console.log("게임 스크립트 실행 확인");

// HTML에서 id가 "game"인 캔버스 요소를 가져옵니다.
const canvas = document.getElementById("game");
// 캔버스에 2D 그림을 그리는 도구를 가져옵니다.
const ctx = canvas.getContext("2d");
const lobbyCanvas = document.getElementById("lobby");
const lobbyCtx = lobbyCanvas.getContext("2d");
const lobbyScreen = document.getElementById("lobby-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-btn");
const hitSound = new Audio("sound/hit.mp3");
hitSound.preload = "auto";

// 장애물 속도 설정 (픽셀/프레임)
const obstacleMinSpeed = 8;
const obstacleMaxSpeed = 10;
const stageStartDuration = 1.2;
const stageClearDuration = 1.2;

// 장애물 크기 설정
const obstacleWidth = 42 * 1.2 * 1.2;
const obstacleHeight = 28 * 1.2;

// 디버그 정보와 빨간 테두리 히트박스를 표시할지 설정합니다.
let showDebug = false;
let showHitbox = showDebug;

/*
| 속도 변동(stage1 기준) | 내 체감 | 조정한 것 |
|---|---|---|
| 최저 4 / 최고 6 (이하 4 / 6) | 너무 빠름 | 시작 속도를 최저, 최고치 -2.5 |
| 1.5 / 3.5 | 다소 느림 | 최저, 최고치 +0.5 |
| 2 / 4 | 다소 적당 | 속도는 적당. 플레이어 속도 변화 필요? |
*/

function getStageObstacleSpeeds(stage) {
  const stageSpeedIncrease = ((stage - 1) * stage) / 2;
  const speedAdjustment = -6.5 + stageSpeedIncrease;
  return {
    minSpeed: obstacleMinSpeed + speedAdjustment,
    maxSpeed: obstacleMaxSpeed + speedAdjustment,
  };
}

function applyObstacleSpeed(obstacle, stage, previousSpeed, speedRatio) {
  const { minSpeed, maxSpeed } = getStageObstacleSpeeds(stage);
  const speedVariation = speedRatio === undefined ? Math.random() : speedRatio;
  let nextSpeed = minSpeed + speedVariation * (maxSpeed - minSpeed);
  if (nextSpeed === previousSpeed) {
    nextSpeed = previousSpeed === minSpeed ? maxSpeed : minSpeed;
  }
  obstacle.speed = nextSpeed;
}

// 화면 크기에 맞춘 길과 사각형의 크기, 위치를 모아 둡니다.
const playerSize = 32;
const destinationSize = 32;
const livesTextX = 12;
const livesTextY = 28;
const livesFont = "20px sans-serif";
const startingLives = 3;

// 플레이어 이동 속도와 프레임 간 최대 시간을 정합니다.
/*
| 120 | 다소 느림 | 탈락 |
| 240 | 적당 | 채택 |
| 300 | 다소 빠름? | 탈락 |

++ 다소 느리므로 360으로 조정 / 26.11.23
*/
const playerSpeed = 360;
const maxFrameTime = 0.05;

// 누르고 있는 키와 플레이어의 이동량을 기록합니다.
const keys = {};
let playerOffsetX = 0;
let playerOffsetY = 0;
let previousFrameTime = 0;
let gameState = "lobby";
let lives = startingLives;
let currentStage = 1;
let stageTimerRemaining = 0;
let pausedFromState = null;
let isMuted = false;
let hitSoundAvailable = true;
let wasColliding = false;

function handleHitSoundError(error) {
  if (!hitSoundAvailable) {
    return;
  }
  hitSoundAvailable = false;
  console.warn("충돌 효과음을 재생할 수 없습니다.", error);
}

hitSound.addEventListener("error", handleHitSoundError);

function playHitSound() {
  if (isMuted || !hitSoundAvailable) {
    return;
  }

  try {
    hitSound.currentTime = 0;
    const playback = hitSound.play();
    if (playback) {
      playback.catch(handleHitSoundError);
    }
  } catch (error) {
    handleHitSoundError(error);
  }
}

// 두 사각형이 가로와 세로 방향 모두에서 겹치는지 확인합니다.
function checkCollision(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

// 방향키와 스페이스바가 페이지를 스크롤하지 않도록 막습니다.
function preventPageScroll(event) {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
}

window.addEventListener("keydown", (event) => {
  preventPageScroll(event);
  if (event.code === "KeyV" && !event.repeat) {
    showDebug = !showDebug;
    showHitbox = showDebug;
  }
  if (event.code === "KeyM" && !event.repeat) {
    isMuted = !isMuted;
    hitSound.muted = isMuted;
  }
  if (event.code === "Space" && !event.repeat) {
    if (gameState === "paused") {
      gameState = pausedFromState;
      pausedFromState = null;
      previousFrameTime = 0;
      Object.keys(keys).forEach((key) => {
        keys[key] = false;
      });
    } else if (["stageStart", "playing", "stageClear"].includes(gameState)) {
      pausedFromState = gameState;
      gameState = "paused";
      previousFrameTime = 0;
      Object.keys(keys).forEach((key) => {
        keys[key] = false;
      });
    }
    return;
  }
  if (gameState === "gameover" && event.code === "KeyR" && !event.repeat) {
    resetGame();
    return;
  }
  keys[event.code] = true;
});

window.addEventListener("keyup", (event) => {
  preventPageScroll(event);
  keys[event.code] = false;
});

// 각 장애물의 가로 위치와 레인 번호를 정합니다.
const obstacleLanes = [
  { x: 100, lane: 2 },
  { x: 250, lane: 3 },
  { x: 400, lane: 4 },
  { x: 550, lane: 5 },
  { x: 650, lane: 6 },
  { x: 300, lane: 7 },
];
// 2/8~7/8에 해당하는 여섯 레인의 중앙에 장애물을 배치합니다.
const obstacles = [
  ...obstacleLanes.map(({ x, lane }, index) => ({
    x,
    initialX: x,
    lane,
    speedRatio: index / (obstacleLanes.length - 1),
    speed:
      obstacleMinSpeed +
      (index * (obstacleMaxSpeed - obstacleMinSpeed)) / (obstacleLanes.length - 1),
    initialSpeed:
      obstacleMinSpeed +
      (index * (obstacleMaxSpeed - obstacleMinSpeed)) / (obstacleLanes.length - 1),
  })),
];

// 플레이어와 장애물의 위치 및 속도를 초기 상태로 되돌립니다.
function resetGame() {
  currentStage = 1;
  playerOffsetX = 0;
  playerOffsetY = 0;
  previousFrameTime = 0;
  lives = startingLives;
  wasColliding = false;
  pausedFromState = null;
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
  obstacles.forEach((obstacle) => {
    obstacle.x = obstacle.initialX;
    applyObstacleSpeed(obstacle, currentStage, undefined, obstacle.speedRatio);
    obstacle.initialSpeed = obstacle.speed;
  });
  stageTimerRemaining = stageStartDuration;
  gameState = "stageStart";
}

function startNextStage() {
  currentStage += 1;
  playerOffsetX = 0;
  playerOffsetY = 0;
  lives = startingLives;
  wasColliding = false;
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
  obstacles.forEach((obstacle) => {
    obstacle.x = obstacle.initialX;
    applyObstacleSpeed(obstacle, currentStage, undefined, obstacle.speedRatio);
    obstacle.initialSpeed = obstacle.speed;
  });
  stageTimerRemaining = stageStartDuration;
  gameState = "stageStart";
}

function drawBackground(context, targetCanvas) {
  const roadHeight = targetCanvas.height / 8;

  // 화면 전체를 초록색 들판으로 채웁니다.
  context.fillStyle = "#4caf50";
  context.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

  // 화면 아래쪽 1/8과 위쪽 1/8을 회색 길로 그립니다.
  context.fillStyle = "#777";
  context.fillRect(0, targetCanvas.height - roadHeight, targetCanvas.width, roadHeight);
  context.fillRect(0, 0, targetCanvas.width, roadHeight);

  // 장애물이 다니는 여섯 레인을 짙은 회색으로 칠합니다.
  context.fillStyle = "#333";
  context.fillRect(0, roadHeight, targetCanvas.width, roadHeight * 6);

  // 레인 경계를 얇은 노란색 선으로 표시합니다.
  context.strokeStyle = "#ffd600";
  context.lineWidth = 2;
  for (let laneEdge = 1; laneEdge <= 7; laneEdge += 1) {
    const y = laneEdge * roadHeight;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(targetCanvas.width, y);
    context.stroke();
  }

  // 각 레인 중앙에 일정한 간격으로 흰색 도로 표시를 그립니다.
  context.fillStyle = "white";
  for (let lane = 2; lane <= 7; lane += 1) {
    const markerY = (lane - 0.5) * roadHeight - 2;
    for (let x = 16; x < targetCanvas.width; x += 48) {
      context.fillRect(x, markerY, 18, 4);
    }
  }
}

function drawScene(deltaTime) {
  const stateAtFrameStart = gameState;
  if (stateAtFrameStart === "stageStart") {
    stageTimerRemaining -= deltaTime;
    if (stageTimerRemaining <= 0) {
      gameState = "playing";
    }
  } else if (stateAtFrameStart === "stageClear") {
    stageTimerRemaining -= deltaTime;
    if (stageTimerRemaining <= 0) {
      startNextStage();
    }
  }

  const roadHeight = canvas.height / 8;
  const destinationX = (canvas.width - destinationSize) / 2;
  const destinationY = (roadHeight - destinationSize) / 2;
  const initialPlayerX = (canvas.width - playerSize) / 2;
  const initialPlayerY = (canvas.height - roadHeight) + (roadHeight - playerSize) / 2;
  let playerX = initialPlayerX + playerOffsetX;
  let playerY = initialPlayerY + playerOffsetY;

  // 플레이 중일 때만 플레이어와 장애물을 움직이고 충돌을 확인합니다.
  if (stateAtFrameStart === "playing") {
    const horizontalDirection =
      (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    const verticalDirection =
      (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
    playerX = Math.max(
      0,
      Math.min(
        canvas.width - playerSize,
        playerX + horizontalDirection * playerSpeed * deltaTime,
      ),
    );
    playerY = Math.max(
      0,
      Math.min(
        canvas.height - playerSize,
        playerY + verticalDirection * playerSpeed * deltaTime,
      ),
    );
    playerOffsetX = playerX - initialPlayerX;
    playerOffsetY = playerY - initialPlayerY;

    obstacles.forEach((obstacle) => {
      obstacle.x -= obstacle.speed;
      if (obstacle.x + obstacleWidth <= 0) {
        obstacle.x = canvas.width;
        applyObstacleSpeed(obstacle, currentStage, obstacle.speed);
      }
    });

    // 플레이어와 장애물의 사각형이 겹치는지 확인합니다.
    const playerHitbox = {
      x: playerX,
      y: playerY,
      width: playerSize,
      height: playerSize,
    };
    const isColliding = obstacles.some((obstacle) =>
      checkCollision(playerHitbox, {
        x: obstacle.x,
        y: (obstacle.lane - 0.5) * roadHeight - obstacleHeight / 2,
        width: obstacleWidth,
        height: obstacleHeight,
      }),
    );
    if (isColliding && !wasColliding) {
      console.log("충돌!");
      playHitSound();
      lives -= 1;
      playerOffsetX = 0;
      playerOffsetY = 0;
      playerX = initialPlayerX;
      playerY = initialPlayerY;
      if (lives === 0) {
        gameState = "gameover";
      }
    }
    wasColliding = isColliding;

    if (
      gameState === "playing" &&
      checkCollision(playerHitbox, {
        x: destinationX,
        y: destinationY,
        width: destinationSize,
        height: destinationSize,
      })
    ) {
      gameState = "stageClear";
      stageTimerRemaining = stageClearDuration;
      Object.keys(keys).forEach((key) => {
        keys[key] = false;
      });
    }
  }

  drawBackground(ctx, canvas);

  // 화면 왼쪽 위에 남은 목숨을 흰 글씨로 표시합니다.
  ctx.fillStyle = "white";
  ctx.font = livesFont;
  ctx.fillText(`남은 목숨 : ${lives}`, livesTextX, livesTextY);

  ctx.fillStyle = "white";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${isMuted ? "음소거" : "소리 켬"} (M)`, canvas.width - 12, 18);
  ctx.textAlign = "start";

  if (showDebug) {
    ctx.fillStyle = "white";
    ctx.font = "14px sans-serif";
    ctx.fillText(
      `플레이어 X: ${playerX.toFixed(1)}, Y: ${playerY.toFixed(1)}`,
      livesTextX,
      livesTextY + 22,
    );
    ctx.fillText(`적 수: ${obstacles.length}`, livesTextX, livesTextY + 42);
  }

  // 화면 아래 가운데에 노란색 플레이어를 그립니다.
  ctx.fillStyle = "yellow";
  ctx.fillRect(playerX, playerY, playerSize, playerSize);
  if (showHitbox) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(playerX, playerY, playerSize, playerSize);
  }

  // 화면 위 가운데에 초록색 목적지를 그립니다.
  ctx.fillStyle = "green";
  ctx.globalAlpha = 0.5;
  ctx.fillRect(destinationX, destinationY, destinationSize, destinationSize);
  ctx.globalAlpha = 1;

  // 설정한 여섯 위치에 빨간색 장애물을 하나씩 그립니다.
  ctx.fillStyle = "red";
  obstacles.forEach((obstacle) => {
    const obstacleY = (obstacle.lane - 0.5) * roadHeight - obstacleHeight / 2;
    ctx.fillRect(obstacle.x, obstacleY, obstacleWidth, obstacleHeight);
    if (showHitbox) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacleY, obstacleWidth, obstacleHeight);
    }
  });

  if (
    gameState === "stageStart" ||
    gameState === "stageClear" ||
    gameState === "paused"
  ) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 48px sans-serif";
    const bannerText =
      gameState === "stageStart"
        ? `Stage ${currentStage}`
        : gameState === "stageClear"
          ? "Stage Clear"
          : "Paused";
    ctx.fillText(bannerText, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  // 게임 오버 상태에서도 화면은 계속 그리되 게임 오버 안내를 표시합니다.
  if (gameState === "gameover") {
    // 캔버스 전체에 옅은 빨간색 반투명 레이어를 덮습니다.
    ctx.fillStyle = "rgba(255, 0, 0, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 게임 오버 문구를 레이어 위에 표시합니다.
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px sans-serif";
    ctx.fillText("R 키를 눌러 다시 시작", canvas.width / 2, canvas.height / 2 + 28);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }
}

drawBackground(lobbyCtx, lobbyCanvas);
startButton.addEventListener("click", () => {
  lobbyScreen.style.display = "none";
  gameScreen.style.display = "block";
  resetGame();
});

function animate(frameTime) {
  // 프레임 간격을 제한해 탭 전환 후에도 플레이어가 갑자기 튀지 않게 합니다.
  const deltaTime =
    previousFrameTime === 0
      ? 0
      : Math.min((frameTime - previousFrameTime) / 1000, maxFrameTime);
  previousFrameTime = frameTime;

  drawScene(deltaTime);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
