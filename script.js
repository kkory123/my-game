// HTML에서 id가 "game"인 캔버스 요소를 가져옵니다.
const canvas = document.getElementById("game");
// 캔버스에 2D 그림을 그리는 도구를 가져옵니다.
const ctx = canvas.getContext("2d");

// 화면 크기에 맞춘 길과 사각형의 크기, 위치를 모아 둡니다.
const roadHeight = canvas.height / 8;
const playerSize = 32;
const destinationSize = 32;
const obstacleWidth = 42;
const obstacleHeight = 28;
const livesTextX = 12;
const livesTextY = 28;
const playerX = (canvas.width - playerSize) / 2;
const playerY = canvas.height - roadHeight / 2 - playerSize / 2;
const destinationX = (canvas.width - destinationSize) / 2;
const destinationY = (roadHeight - destinationSize) / 2;
const livesFont = "20px sans-serif";

// 장애물 애니메이션 설정 (이동 속도는 픽셀/프레임)
const obstacleMinSpeed = 3;
const obstacleMaxSpeed = 5.5;
const obstacleScaleChange = 0.015;
const obstacleMaxScale = (roadHeight - 4) / obstacleHeight;

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
  ...obstacleLanes.map(({ x, lane }) => ({
    x,
    lane,
    speed: obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed),
    scale: 1,
    scaleDirection: 1,
  })),
];

function drawScene() {
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

  // 화면 아래 가운데에 파란색 플레이어를 그립니다.
  ctx.fillStyle = "blue";
  ctx.fillRect(playerX, playerY, playerSize, playerSize);

  // 화면 위 가운데에 초록색 목적지를 그립니다.
  ctx.fillStyle = "green";
  ctx.globalAlpha = 0.5;
  ctx.fillRect(destinationX, destinationY, destinationSize, destinationSize);
  ctx.globalAlpha = 1;

  // 설정한 여섯 위치에 빨간색 장애물을 하나씩 그립니다.
  ctx.fillStyle = "red";
  obstacles.forEach((obstacle) => {
    const width = obstacleWidth * obstacle.scale;
    const height = obstacleHeight * obstacle.scale;
    const x = obstacle.x - (width - obstacleWidth) / 2;
    const y = (obstacle.lane - 0.5) * roadHeight - height / 2;
    ctx.fillRect(x, y, width, height);
  });
}

function animate() {
  obstacles.forEach((obstacle) => {
    obstacle.x -= obstacle.speed;
    obstacle.scale += obstacleScaleChange * obstacle.scaleDirection;
    if (obstacle.scale >= obstacleMaxScale) {
      obstacle.scale = obstacleMaxScale;
      obstacle.scaleDirection = -1;
    } else if (obstacle.scale <= 1) {
      obstacle.scale = 1;
      obstacle.scaleDirection = 1;
    }

    const width = obstacleWidth * obstacle.scale;
    const x = obstacle.x - (width - obstacleWidth) / 2;
    if (x + width <= 0) {
      obstacle.x = canvas.width;
    }
  });

  drawScene();
  requestAnimationFrame(animate);
}

animate();
