"use server";
import nodemailer from "nodemailer";

export const sendMail = async (from: string, to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,

    auth: {
      user: "hacktheplot@gmail.com",
      pass: process.env.GOOGLE_APP_PASSWORD,
    },
  });

  const mail = await transporter.sendMail({
    from: from,
    to: to,
    replyTo: from,
    subject: subject,
    html: html,
  });

  return mail;
};