import { HealthMonitor, type ServiceHealthReport } from "@stelhacks/backend-shared";

export const clockHealth = new HealthMonitor("clock");

export function getHealth(): ServiceHealthReport {
  return clockHealth.getHealth();
}
