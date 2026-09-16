import { redirect } from "next/navigation";
import { serverApi } from "@/lib/server-api";
import { Account, ApiError } from "@/lib/api";
export async function auth(): Promise<Account> {
  try {
    return await serverApi<Account>("auth/me/");
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status))
      redirect("/");
    throw error;
  }
}
