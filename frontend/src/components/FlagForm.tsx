"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { api, Challenge } from "@/lib/api";
export default function FlagForm({
  question,
}: {
  question: Challenge;
  type?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const flag = new FormData(e.currentTarget).get("flag");
        try {
          await api("challenges/" + question.id + "/submit/", {
            method: "POST",
            body: JSON.stringify({ flag }),
          });
          router.push("/questions");
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Unable to submit.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex gap-2">
        <Input
          aria-label="Flag"
          name="flag"
          placeholder="flag{...}"
          required
          autoComplete="off"
          className="bg-black text-white rounded-full"
        />
        <button
          disabled={busy}
          className="rounded-full border border-violet-500 px-5 text-white disabled:opacity-50"
        >
          {busy ? "Checkingâ€¦" : "Submit"}
        </button>
      </div>
      {message && (
        <p role="alert" className="text-red-400 text-sm mt-3">
          {message}
        </p>
      )}
    </form>
  );
}
