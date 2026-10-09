document.querySelectorAll(".game-button").forEach((button) => {
  button.addEventListener("click", () => {
    const isSelected = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isSelected));
  });
});

const todayDate = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

document.querySelector("#today-date").textContent = `오늘은 ${todayDate}입니다.`;
