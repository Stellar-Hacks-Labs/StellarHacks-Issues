# In-app notifications

Lifecycle events are projected into user-owned rows. Delivery is idempotent by `(user_id, event_key, type)`, and replaying the chain cannot duplicate a notice. RLS is the authorization boundary.
