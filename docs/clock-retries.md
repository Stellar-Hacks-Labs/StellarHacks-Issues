# Clock retry policy

The clock retries only transient RPC and fee failures, at most four times. Delays use capped exponential backoff with 25% jitter. Before every retry it reads the phase again; an already-applied transition is never resubmitted. Exhausted work is written to `clock_dead_letters` for an organizer to inspect.
