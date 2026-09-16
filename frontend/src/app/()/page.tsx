"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label_2";
import { Input } from "@/components/ui/input_2";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { api, Account, EventInfo } from "@/lib/api";
export default function LoginPage() {
  const router = useRouter();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<EventInfo>("event/")
      .then(setEvent)
      .catch(() => {});
  }, []);
  return (
    <main className="w-screen min-h-screen bg-black">
      <div className="max-w-md w-full z-10 mx-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-8 border border-zinc-800 bg-black">
        <p className="text-violet-400 text-xs tracking-widest mb-3">
          IIIT VADODARA Â· TECHHUNT
        </p>
        <h1 className="font-bold text-2xl text-white">Welcome to TechHunt</h1>
        <p className="text-neutral-400 text-sm mt-2">
          Sign in with your team account. The next clue is waiting.
        </p>
        {event?.demo_mode && (
          <div className="mt-6 rounded-lg border border-violet-500/40 p-4">
            <p className="text-sm text-violet-300 mb-3">
              Portfolio demo · practice challenges, synthetic teams.
            </p>
            <button
              disabled={busy}
              className="w-full bg-violet-600 hover:bg-violet-500 rounded-md py-2 text-white"
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api<Account>("auth/demo/", { method: "POST" });
                  router.push("/questions");
                  router.refresh();
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Unable to start demo.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Try the demo
            </button>
          </div>
        )}
        <form
          className="my-8 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const data = new FormData(e.currentTarget);
            try {
              await api<Account>("auth/login/", {
                method: "POST",
                body: JSON.stringify({
                  email: data.get("email"),
                  password: data.get("password"),
                }),
              });
              router.push("/questions");
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to sign in.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-red-400 text-sm">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-md h-11 border border-zinc-700 bg-zinc-900 text-white disabled:opacity-50"
          >
            {busy ? "Signing inâ€¦" : "Log in â†’"}
          </button>
        </form>
        <p className="text-xs text-zinc-400">
          {event?.status === "live"
            ? "The hunt is live."
            : event?.starts_at
              ? "Starts " +
                new Date(event.starts_at).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                }) +
                " IST. You can sign in now."
              : "Your organizers will announce the start time."}
        </p>
      </div>
      <BackgroundBeams className="pointer-events-none" />
    </main>
  );
}
