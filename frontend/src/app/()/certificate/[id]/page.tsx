import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { jwtVerify } from "jose";
import { Badge, Trophy } from "lucide-react";

interface CertificatePayload {
  id: string;
  name: string;
  teamName: string;
  standing: number;
  eventName: string;
}

const cacheInvalidation = ["1BISON", "2Dandadan"];

export default async function Certificate({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const certID = (await params).id;
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload: certPayload }: { payload: CertificatePayload } =
      await jwtVerify(certID, secret);

    if (
      cacheInvalidation.includes(
        certPayload.standing.toString() + certPayload.teamName,
      )
    ) {
      throw new Error("Invalid Certificate Signature");
    }

    return (
      <div className="min-h-screen bg-black flex items-center justify-center bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto bg-green-500/10 w-fit p-3 rounded-full">
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-white space-y-2">
              <h1 className="font-bold text-green-500">
                Tech Hunt Certificate
              </h1>
              <p className="text-sm text-zinc-400">Signature Verified!</p>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 rounded-lg bg-black/50 p-4 backdrop-blur-sm">
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">Participant Name</p>
                <p className="text-lg font-semibold text-white">
                  {certPayload.name}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">Team Name</p>
                <p className="text-lg font-semibold text-white">
                  {certPayload.teamName}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">Standing</p>
                <p className="text-lg font-semibold text-white">
                  {certPayload.standing <= 10
                    ? certPayload.standing
                    : "Participant"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">Event</p>
                <p className="text-lg font-semibold text-white">
                  {"TechHunt '24"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (e) {
    // Invalid cert probably
    return (
      <>
        <h1 className={"m-auto w-fit p-4"}>
          Invalid Certificate Signature, Screw you for tryna fake it!
        </h1>
      </>
    );
  }
}
