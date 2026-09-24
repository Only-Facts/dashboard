export interface HealthResponse {
  status: string;
  message: string;
}

export async function getBackendHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error(
      `Backend request failed: ${response.status}`
    );
  }

  const data: HealthResponse = await response.json();

  return data;
}
