export interface BackendHealth {
  ok: boolean;
  database: string;
  now: string;
  postgis_version: string;
}

export async function getBackendHealth(): Promise<BackendHealth> {
  const response = await fetch("/api/health");
  if (!response.ok) {
    throw new Error(`Backend respondió con HTTP ${response.status}`);
  }
  return response.json() as Promise<BackendHealth>;
}
