export function normalizeTaskUsedtime(taskUsedtime: number) {
  return Math.round(taskUsedtime);
}

export function minutesToMm(minutes: number, workingDays = 21) {
  const total = workingDays * 480;
  return total > 0 ? minutes / total : 0;
}

export function minutesToMd(minutes: number) {
  return minutes / 480;
}

export function formatMm(minutes: number, workingDays = 21) {
  return minutesToMm(minutes, workingDays).toFixed(2);
}

export function formatMd(minutes: number) {
  return minutesToMd(minutes).toFixed(2);
}
