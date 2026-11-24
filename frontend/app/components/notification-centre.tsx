"use client";
import { useEffect, useState } from "react";
import { NotificationBadge } from "./notification-badge";
import { NotificationItem } from "./notification-item";

type Note = {
  id: number;
  message: string;
  created_at: string;
  read_at: string | null;
};
export function NotificationCentre() {
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => {
    void fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((body) => setNotes(body.notifications));
  }, []);
  async function markRead(id: number) {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok)
      setNotes((current) =>
        current.map((note) =>
          note.id === id
            ? { ...note, read_at: new Date().toISOString() }
            : note,
        ),
      );
  }
  return (
    <details className="border-y border-rule px-3.5 py-2.5">
      <summary className="flex cursor-pointer justify-between">
        Notifications{" "}
        <NotificationBadge
          count={notes.filter((note) => note.read_at === null).length}
        />
      </summary>
      <ul className="mt-3 grid gap-3">
        {notes.length === 0 ? (
          <li className="text-ink-soft">Nothing new.</li>
        ) : (
          notes.map((note) => (
            <NotificationItem
              key={note.id}
              item={note}
              onRead={(id) => void markRead(id)}
            />
          ))
        )}
      </ul>
    </details>
  );
}
