"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
export default function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <main className="bg-black text-white min-h-screen flex flex-col items-center justify-center gap-5">
      <h1 className="text-2xl">Ready to sign out?</h1>
      <button
        className="border border-violet-400 rounded px-6 py-3"
        onClick={async () => {
          try {
            await api("auth/logout/", { method: "POST" });
            router.push("/");
            router.refresh();
          } catch {
            setError("Unable to sign out. Please retry.");
          }
        }}
      >
        Sign out
      </button>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
