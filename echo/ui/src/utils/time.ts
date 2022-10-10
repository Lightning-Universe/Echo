export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = seconds % 60;

  const hoursString = hours > 0 ? `${hours}:` : "";
  const minutesString = minutes < 10 ? `0${minutes}:` : `${minutes}:`;
  const secondsString = secondsLeft < 10 ? `0${secondsLeft}` : `${secondsLeft}`;

  return `${hoursString}${minutesString}${secondsString}`;
}
