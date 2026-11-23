import { HealthMonitor, type ServiceHealthReport } from "@stelhacks/backend-shared";

export const reviewerHealth = new HealthMonitor("reviewer");

export function getHealth(): ServiceHealthReport {
  return reviewerHealth.getHealth();
}
