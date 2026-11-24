export function notificationTime(value: string, now = Date.now()) {
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(value).getTime()) / 60_000),
  );
  return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`;
}
