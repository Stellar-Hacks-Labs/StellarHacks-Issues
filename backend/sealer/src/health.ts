import { HealthMonitor, type ServiceHealthReport } from "@stelhacks/backend-shared";

export const sealerHealth = new HealthMonitor("sealer");

export function getHealth(): ServiceHealthReport {
  return sealerHealth.getHealth();
}
