import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { Payload } from "@/types/Payload";

export async function auth() {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  const jwt = (await cookies()).get("access_token")?.value;

  if (!jwt) {
    throw new Error("No token found");
  }
  try {
    const { payload }: { payload: Payload } = await jwtVerify(jwt, secret);
    return payload;
  } catch (e: any) {
    throw new Error(e.toString());
  }
}

export async function generateJWT(payload: Payload) {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  const alg = "HS256";

  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("4w")
    .sign(secret);
}
