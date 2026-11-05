console.log("게임 스크립트 실행 확인");

// HTML에서 id가 "game"인 캔버스 요소를 가져옵니다.
const canvas = document.getElementById("game");
// 캔버스에 2D 그림을 그리는 도구를 가져옵니다.
const ctx = canvas.getContext("2d");

// 장애물 속도 설정 (픽셀/프레임)
const obstacleMinSpeed = 8;
const obstacleMaxSpeed = 10;

// 장애물 크기 설정
const obstacleWidth = 42;
const obstacleHeight = 28;

// 빨간 테두리 히트박스를 표시할지 설정합니다.
const showHitbox = true;

function getDifferentObstacleSpeed(previousSpeed) {
  const nextSpeed =
    obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed);
  return nextSpeed === previousSpeed
    ? previousSpeed === obstacleMinSpeed
      ? obstacleMaxSpeed
      : obstacleMinSpeed
    : nextSpeed;
}

// 화면 크기에 맞춘 길과 사각형의 크기, 위치를 모아 둡니다.
const playerSize = 32;
const destinationSize = 32;
const livesTextX = 12;
const livesTextY = 28;
const livesFont = "20px sans-serif";

const initialRoadHeight = canvas.height / 8;
console.log(
  `플레이어 위치: x=${(canvas.width - playerSize) / 2}, y=${canvas.height - initialRoadHeight + (initialRoadHeight - playerSize) / 2}`,
);

// 플레이어 이동 속도와 프레임 간 최대 시간을 정합니다.
/*
| 120 | 다소 느림 | 탈락 |
| 240 | 적당 | 채택 |
| 300 | 다소 빠름? | 탈락 |
*/
const playerSpeed = 240;
const maxFrameTime = 0.05;

// 누르고 있는 키와 플레이어의 이동량을 기록합니다.
const keys = {};
let playerOffsetX = 0;
let playerOffsetY = 0;
let previousFrameTime = 0;
let wasColliding = false;

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
    lane,
    speed:
      obstacleMinSpeed +
      (index * (obstacleMaxSpeed - obstacleMinSpeed)) / (obstacleLanes.length - 1),
  })),
];

function drawScene(deltaTime) {
  const roadHeight = canvas.height / 8;
  const destinationX = (canvas.width - destinationSize) / 2;
  const destinationY = (roadHeight - destinationSize) / 2;

  const horizontalDirection =
    (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  const verticalDirection =
    (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
  const initialPlayerX = (canvas.width - playerSize) / 2;
  const initialPlayerY = (canvas.height - roadHeight) + (roadHeight - playerSize) / 2;
  const previousPlayerX = initialPlayerX + playerOffsetX;
  const previousPlayerY = initialPlayerY + playerOffsetY;
  const playerX = Math.max(
    0,
    Math.min(
      canvas.width - playerSize,
      initialPlayerX + playerOffsetX + horizontalDirection * playerSpeed * deltaTime,
    ),
  );
  const playerY = Math.max(
    0,
    Math.min(
      canvas.height - playerSize,
      initialPlayerY + playerOffsetY + verticalDirection * playerSpeed * deltaTime,
    ),
  );
  playerOffsetX = playerX - initialPlayerX;
  playerOffsetY = playerY - initialPlayerY;
  if (playerX !== previousPlayerX || playerY !== previousPlayerY) {
    console.log(`플레이어 위치: x=${playerX}, y=${playerY}`);
  }

  obstacles.forEach((obstacle) => {
    obstacle.x -= obstacle.speed;
    if (obstacle.x + obstacleWidth <= 0) {
      obstacle.x = canvas.width;
      obstacle.speed = getDifferentObstacleSpeed(obstacle.speed);
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
  }
  wasColliding = isColliding;

  // 화면 전체를 초록색 들판으로 채웁니다.
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 화면 아래쪽 1/8을 회색 길로 그립니다.
  ctx.fillStyle = "#777";
  ctx.fillRect(0, canvas.height - roadHeight, canvas.width, roadHeight);

  // 화면 위쪽 1/8을 회색 길로 그립니다.
  ctx.fillRect(0, 0, canvas.width, roadHeight);

  // 장애물이 다니는 여섯 레인을 짙은 회색으로 칠합니다.
  ctx.fillStyle = "#333";
  ctx.fillRect(0, roadHeight, canvas.width, roadHeight * 6);

  // 레인 경계를 얇은 노란색 선으로 표시합니다.
  ctx.strokeStyle = "#ffd600";
  ctx.lineWidth = 2;
  for (let laneEdge = 1; laneEdge <= 7; laneEdge += 1) {
    const y = laneEdge * roadHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 각 레인 중앙에 일정한 간격으로 흰색 도로 표시를 그립니다.
  ctx.fillStyle = "white";
  for (let lane = 2; lane <= 7; lane += 1) {
    const markerY = (lane - 0.5) * roadHeight - 2;
    for (let x = 16; x < canvas.width; x += 48) {
      ctx.fillRect(x, markerY, 18, 4);
    }
  }

  // 화면 왼쪽 위에 남은 목숨을 흰 글씨로 표시합니다.
  ctx.fillStyle = "white";
  ctx.font = livesFont;
  ctx.fillText("남은 목숨 : 3", livesTextX, livesTextY);

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
}

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
