import type { components } from "@/types/api";
export type Account = components["schemas"]["AccountOutput"];
export type Challenge = components["schemas"]["ChallengeOutput"];
export type EventInfo = components["schemas"]["EventOutput"];
export type Board = components["schemas"]["LeaderboardOutput"];
export type Certificate = components["schemas"]["CertificateOutput"];
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD"].includes(method)) {
    const csrf = await fetch("/api/v1/auth/csrf/", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!csrf.ok)
      throw new ApiError(
        csrf.status,
        "The server is waking up. Please retry shortly.",
      );
    headers.set("X-CSRFToken", (await csrf.json()).csrfToken);
  }
  const response = await fetch("/api/v1/" + path, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = await response
    .json()
    .catch(() => ({
      detail: "The server is temporarily unavailable. Please retry.",
    }));
  if (!response.ok)
    throw new ApiError(
      response.status,
      typeof data.detail === "string" ? data.detail : JSON.stringify(data),
    );
  return data as T;
}
