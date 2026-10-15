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
// 2/8부터 7/8까지 각 레인의 세로 중앙에 장애물을 하나씩 배치합니다.
const obstacles = [
  { x: 100, y: (canvas.height * 2) / 8 + (roadHeight - obstacleHeight) / 2 },
  { x: 250, y: (canvas.height * 3) / 8 + (roadHeight - obstacleHeight) / 2 },
  { x: 400, y: (canvas.height * 4) / 8 + (roadHeight - obstacleHeight) / 2 },
  { x: 550, y: (canvas.height * 5) / 8 + (roadHeight - obstacleHeight) / 2 },
  { x: 650, y: (canvas.height * 6) / 8 + (roadHeight - obstacleHeight) / 2 },
  { x: 300, y: (canvas.height * 7) / 8 + (roadHeight - obstacleHeight) / 2 },
];

// 화면 전체를 초록색 들판으로 채웁니다.
ctx.fillStyle = "#4caf50";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// 화면 아래쪽 1/8을 회색 길로 그립니다.
ctx.fillStyle = "#777";
ctx.fillRect(0, canvas.height - roadHeight, canvas.width, roadHeight);

// 화면 위쪽 1/8을 회색 길로 그립니다.
ctx.fillRect(0, 0, canvas.width, roadHeight);

// 화면 왼쪽 위에 남은 목숨을 흰 글씨로 표시합니다.
ctx.fillStyle = "white";
ctx.font = livesFont;
ctx.fillText("남은 목숨 : 3", livesTextX, livesTextY);

// 화면 아래 가운데에 파란색 플레이어를 그립니다.
ctx.fillStyle = "blue";
ctx.fillRect(playerX, playerY, playerSize, playerSize);

// 화면 위 가운데에 초록색 목적지를 그립니다.
ctx.fillStyle = "green";
ctx.fillRect(destinationX, destinationY, destinationSize, destinationSize);

// 설정한 여섯 위치에 빨간색 장애물을 하나씩 그립니다.
ctx.fillStyle = "red";
obstacles.forEach((obstacle) => {
  ctx.fillRect(obstacle.x, obstacle.y, obstacleWidth, obstacleHeight);
});
