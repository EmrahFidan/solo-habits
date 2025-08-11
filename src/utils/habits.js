// Shared small utilities for habit/challenge components

export function formatDateYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDaysSinceStart(startDate) {
  if (!startDate) return 0;

  const start = new Date(startDate + "T00:00:00");
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function getProgressClass(percentage) {
  let classes = "visual-progress-bar";
  if (percentage >= 25 && percentage < 50) classes += " milestone-25";
  if (percentage >= 50 && percentage < 75) classes += " milestone-50";
  if (percentage >= 75 && percentage < 95) classes += " milestone-75 glow";
  if (percentage >= 95) classes += " milestone-100 glow pulse";
  return classes;
}

export function getDiamondClass(monthsCompleted) {
  if (monthsCompleted >= 6) return "diamond-legendary"; // 6+ Gold
  if (monthsCompleted >= 4) return "diamond-master"; // 4-5 Red
  if (monthsCompleted >= 2) return "diamond-advanced"; // 2-3 Purple
  return "diamond-basic"; // 1 Blue
}


