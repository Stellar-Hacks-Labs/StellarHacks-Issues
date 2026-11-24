import { notificationTime } from "../../lib/notifications/format";
export function NotificationItem({
  item,
  onRead,
}: {
  item: {
    id: number;
    message: string;
    created_at: string;
    read_at: string | null;
  };
  onRead: (id: number) => void;
}) {
  return (
    <li className={item.read_at === null ? "font-medium" : "text-ink-soft"}>
      <p>{item.message}</p>
      <div className="flex justify-between">
        <time className="text-xs">{notificationTime(item.created_at)}</time>
        {item.read_at === null && (
          <button
            type="button"
            className="text-xs underline"
            onClick={() => onRead(item.id)}
          >
            Mark read
          </button>
        )}
      </div>
    </li>
  );
}
