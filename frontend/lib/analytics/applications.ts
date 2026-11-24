export function applicationDropoff(applications: number, approved: number) {
  return Math.max(0, applications - approved);
}
