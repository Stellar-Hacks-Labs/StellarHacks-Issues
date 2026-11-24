# Clock error classes

- **retryable:** timeouts, connection failures, 429 and temporary 5xx responses.
- **fee:** insufficient fee/balance and sequence failures; fee escalation must remain under the configured ceiling.
- **terminal:** contract refusals and unknown errors. These stop immediately.
