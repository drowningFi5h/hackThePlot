"use server";

import { Errors } from "@/classes/Errors";
import { auth } from "@/functions/auth";
import bcrypt from "bcrypt";
import { db } from "@/drizzle";
import { userTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { send } from "process";
import { sendMail } from "./sendMail";

async function updateUser(user: {
  username: string;
  email: string;
  password: string;
}, raw_pass: string) {
  const dbUser = await db.query.userTable.findFirst({
    where: eq(userTable.email, user.email),
  });

  if (!dbUser) {
    await db.insert(userTable).values(user);
    await sendMail("HackThePlot", user.email, "Welcome to the TechHunt", htmlTemplate(user.username, user.email, raw_pass))
  } else {
    await db.update(userTable).set(user).where(eq(userTable.email, user.email));
  }
}

export async function signup(
  data: {
    username: string;
    email: string;
    password: string;
  }[]
) {
  try {
    const payload = await auth();
    if (payload.role !== "admin") {
      return Errors.AuthError("You are not authorized to perform this action");
    }

    const raw_pass: string[] = [];

    for (let i = 0; i < data.length; i++) {
      raw_pass.push(data[i].password);
      data[i].password = await bcrypt.hash(data[i].password, 10);
    }

    try {
      const finalPromise = [];

      for (let i = 0; i < data.length; i++) {
        finalPromise.push(updateUser(data[i], raw_pass[i]));
      }

      await Promise.all(finalPromise);

      return {
        message: "Sign up successful",
        error: false,
      };
    } catch (e) {
      return Errors.DBError(e);
    }
  } catch (e) {
    return Errors.AuthError(e);
  }
}

const htmlTemplate = (teamName: string, email: string, password: string) => {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IIITV Coding Club - Email Verification</title>
</head>
<body style="font-family: ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; line-height: 1.5; -webkit-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background-color: #121212; color: #e0e0e0; margin: 0; padding: 0;">
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #121212;">
        <div style="max-width: 28rem; margin: 2rem auto;">
            <div style="background-color: #1e1e1e; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.3);">
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <img src="https://i.imgur.com/XDemAsx.png" alt="cc" style="height: 30px; margin-right: 10px;">
                    <h1 style="font-size: 1.25rem; font-weight: 600; color: #ffffff; margin: 0;">Hack The Plot</h1>
                </div>
                <div style="background-color: #2a2a2a; padding: 1rem; border-radius: 0.5rem;">
                    <p style="color: #e0e0e0; margin-bottom: 1rem;">Hola! Team ${teamName}👋 TechHunt here...</p>
                    <p style="color: #e0e0e0; margin-bottom: 1rem;">The first step towards uncovering the mystery of Anaya is actually being able to login!</p>
                    <p style="color: #e0e0e0; margin-bottom: 1rem;">So here are your login credentials fellow hunter...</p>
                    <div style="display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; font-size: 0.875rem; font-weight: 500; height: 4rem; padding-left: 1rem; padding-right: 1rem; border: 0.5px solid #bb86fc; color: #ffffff; width: fit-content; border-radius: 0.5rem; text-decoration: none;">
                        <span style="display: inline-flex; color: #ffffff; text-decoration: none; margin: auto; padding: 8px;">Email:  ${email.replace('@', '&#8203;@').replace(".","&#8203;.")}<br>Pass:  ${password}</span>
                    </div>
                    <p style="color: #e0e0e0; margin-top: 1rem;">For all announcements, join our <a href="https://chat.whatsapp.com/ElqeDEwzTPv6syRVmqv6B5" style="text-decoration:none;">WhatsApp Group</a></p>
                    <p style="color: #e0e0e0; margin-top: 1rem;">Happy Hacking!</p>
                    <p style="color: #e0e0e0; margin-top: 1rem;">PS: Don't forget to bring your laptops, headphones and ego.</p>
                </div>
                <p style="color: #8a8a8a; font-size: 0.875rem; margin-top: 0.8rem;">Made with 
                    <img src="https://iiitvcc.vercel.app/heart.png" alt="love" style="display: inline-block; width: 1rem; height: 1rem;">
                    by <a href="https://hacktheplot.vercel.app" style="color: #bb86fc; text-decoration: none;">Team TechHunt</a>
                </p>
                <p style="color: #8a8a8a; font-size: 0.875rem; margin-top: -0.8rem;">Questions? <a href="tel:9074755597" style="color: #bb86fc; text-decoration: none;">Contact Us</a></p>
            </div>
        </div>
    </div>
</body>
</html>

  `;
};
