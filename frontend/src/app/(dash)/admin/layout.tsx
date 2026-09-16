import { auth } from "@/functions/auth";
import { redirect } from "next/navigation";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if ((await auth()).role !== "admin") redirect("/questions");
  return children;
}
