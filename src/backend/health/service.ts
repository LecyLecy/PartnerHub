import "server-only";

export function getHealthStatus() {
  return { service: "partnerhub", status: "ok", stage: "foundation" };
}
