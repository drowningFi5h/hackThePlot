"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="p-8 text-white">
      <h1 className="text-2xl mb-4">Unable to load this page</h1>
      <p className="text-zinc-400 mb-5">
        The server may be waking up, or this challenge may still be locked.
      </p>
      <button className="border rounded px-5 py-2" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
