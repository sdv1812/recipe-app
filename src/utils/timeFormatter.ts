/**
 * Format minutes into hours and minutes
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "30m", "1h", "1h 30m")
 */
export const formatTime = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
};
