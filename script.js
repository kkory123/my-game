// HTML에서 id가 "game"인 캔버스 요소를 가져옵니다.
const canvas = document.getElementById("game");
// 캔버스에 2D 그림을 그릴 수 있는 도구를 가져옵니다.
const ctx = canvas.getContext("2d");

// 첫 번째 사각형의 색을 빨간색으로 정합니다.
ctx.fillStyle = "red";
// (0, 0) 위치에서 가로 50, 세로 50 크기의 빨간 사각형을 그립니다.
ctx.fillRect(0, 0, 50, 50);

// 두 번째 사각형의 색을 노란색으로 정합니다.
ctx.fillStyle = "yellow";
// (750, 0) 위치에서 가로 50, 세로 50 크기의 노란 사각형을 그립니다.
ctx.fillRect(750, 0, 50, 50);

// 세 번째 사각형의 색을 초록색으로 정합니다.
ctx.fillStyle = "green";
// (0, 550) 위치에서 가로 50, 세로 50 크기의 초록 사각형을 그립니다.
ctx.fillRect(0, 550, 50, 50);

// 네 번째 사각형의 색을 흰색으로 정합니다.
ctx.fillStyle = "white";
// (400, 300) 위치에서 가로 20, 세로 20 크기의 흰 사각형을 그립니다.
ctx.fillRect(400, 300, 20, 20);

// 좌표 글씨의 색을 흰색으로 정합니다.
ctx.fillStyle = "white";
// 좌표 글씨의 크기와 글꼴을 정합니다.
ctx.font = "12px sans-serif";
// 빨간 사각형 오른쪽에 시작 좌표를 표시합니다.
ctx.fillText("(0, 0)", 55, 25);
// 노란 사각형 왼쪽에 시작 좌표를 표시합니다.
ctx.fillText("(750, 0)", 690, 25);
// 초록 사각형 오른쪽에 시작 좌표를 표시합니다.
ctx.fillText("(0, 550)", 55, 580);
// 흰 사각형 오른쪽에 시작 좌표를 표시합니다.
ctx.fillText("(400, 300)", 425, 315);
