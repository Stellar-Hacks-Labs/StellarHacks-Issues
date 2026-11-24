import { NOTIFICATION_TYPES } from "../../lib/notifications/preferences";
import { saveNotificationPreferences } from "./actions";
export function NotificationPreferences({ enabled }: { enabled: string[] }) {
  return (
    <form action={saveNotificationPreferences} className="grid gap-3">
      {NOTIFICATION_TYPES.map((type) => (
        <label key={type} className="flex gap-2">
          <input
            type="checkbox"
            name={type}
            defaultChecked={enabled.includes(type)}
          />
          {type.replaceAll("_", " ")}
        </label>
      ))}
      <button className="w-fit underline">Save notification preferences</button>
    </form>
  );
}
