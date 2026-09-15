import { NextRequest, NextResponse } from "next/server";
import { generateJWT } from "@/functions/auth";

export async function POST(req: NextRequest) {
  const token = await generateJWT(await req.json());
  const url = new URL(`/certificate/${token}`, process.env.HOST).toString();

  return NextResponse.json({ url });
}
