import type { ProjectedEvent } from "../records.js";
import { notificationKey } from "./dedupe.js";
import { directRecipients } from "./recipients.js";
import { notificationType } from "./rules.js";
import { notificationCopy } from "./templates.js";
import { writeNotifications } from "./write.js";

export async function deliverLifecycleNotifications(events: readonly ProjectedEvent[]) {
  const rows = events.flatMap((event) => {
    const type = notificationType(event.name, event.fields);
    if (type === null) return [];
    return directRecipients(event.fields).map((user) => ({ recipient: user, contract_id: event.contract_id, event_key: notificationKey(event.contract_id, event.ledger, event.event_index, user, type), type, message: notificationCopy(type) }));
  });
  await writeNotifications(rows);
}

export * from "./rules.js";
