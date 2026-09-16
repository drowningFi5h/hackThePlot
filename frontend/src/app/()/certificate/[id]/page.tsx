import { serverApi } from "@/lib/server-api";
import { ApiError, Certificate } from "@/lib/api";
import { Trophy, BadgeCheck } from "lucide-react";
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = decodeURIComponent((await params).id);
  if (!/^[0-9a-f-]{36}:[A-Za-z0-9_-]+$/.test(id))
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Invalid or revoked certificate.</p>
      </main>
    );
  let certificate: Certificate;
  try {
    certificate = await serverApi<Certificate>("certificates/" + id + "/");
  } catch (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>
          {error instanceof ApiError && error.status === 404
            ? "Invalid or revoked certificate."
            : "Verification is temporarily unavailable. Please retry."}
        </p>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <article className="w-full max-w-md border border-zinc-800 rounded-xl p-8 bg-zinc-950">
        <Trophy className="text-green-400 mb-5" size={36} />
        <h1 className="text-2xl font-bold">{certificate.event_name}</h1>
        <p className="text-green-400 flex gap-2 mt-3">
          <BadgeCheck size={20} /> Verified certificate
        </p>
        <dl className="mt-8 space-y-5">
          <div>
            <dt className="text-zinc-500 text-sm">Team</dt>
            <dd className="text-xl">{certificate.team_name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 text-sm">Standing</dt>
            <dd>Rank {certificate.rank}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 text-sm">Score</dt>
            <dd>{certificate.score.toFixed(2)}</dd>
          </div>
        </dl>
      </article>
    </main>
  );
}
