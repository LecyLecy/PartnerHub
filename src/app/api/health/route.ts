import { getHealthStatus } from "@/backend/health/service";

export function GET() {
  return Response.json(getHealthStatus());
}
