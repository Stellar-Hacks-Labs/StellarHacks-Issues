export function NotificationBadge({ count }: { count: number }) {
  return count > 0 ? (
    <span
      aria-label={`${count} unread`}
      className="rounded-full bg-danger px-2 text-xs text-white"
    >
      {count}
    </span>
  ) : null;
}
