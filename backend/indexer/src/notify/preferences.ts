import type { NotificationType } from "./rules.js";
export function preferenceAllows(preferences: Partial<Record<NotificationType, boolean>>, type: NotificationType) { return preferences[type] !== false; }
