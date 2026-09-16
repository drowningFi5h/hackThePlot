import "server-only";
import { cookies } from "next/headers";
import { ApiError } from "./api";
export async function serverApi<T>(path: string): Promise<T> {
  const response = await fetch(
    (process.env.BACKEND_URL || "http://127.0.0.1:8000") + "/api/v1/" + path,
    {
      headers: { Cookie: (await cookies()).toString() },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(
      response.status,
      typeof data.detail === "string"
        ? data.detail
        : "Unable to load this page.",
    );
  return data as T;
}
