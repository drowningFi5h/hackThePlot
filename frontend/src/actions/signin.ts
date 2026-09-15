"use server";

import bcrypt from "bcrypt";
import { db } from "@/drizzle";
import { eq } from "drizzle-orm";
import { userTable } from "@/drizzle/schema";
import { Errors } from "@/classes/Errors";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { Payload } from "@/types/Payload";
import { generateJWT } from "@/functions/auth";

export async function signIn(email: string, password: string) {
  try {
    if (
      process.env.NEXT_PUBLIC_LOCKUP_TIME &&
      new Date(parseInt(process.env.NEXT_PUBLIC_LOCKUP_TIME)) < new Date()
    ) {
      const user = await db.query.userTable.findFirst({
        where: eq(userTable.email, email),
      });

      if (!user) {
        return Errors.NotFound("User not found");
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return Errors.Unsuccessful("Incorrect password");
      }

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      } as Payload;

      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      const alg = "HS256";

      const token = await generateJWT(payload);
      (await cookies()).set("access_token", token);

      return {
        message: "Sign in successful",
        error: false,
        data: payload,
      };
    } else {
      return Errors.Unsuccessful("Sign in is locked");
    }
  } catch (e) {
    return Errors.DBError(e);
  }
}
