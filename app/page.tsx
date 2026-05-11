export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const rows = await prisma.client.findMany({ orderBy: { createdAt: "asc" } });
  const clients = rows.map(c => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() }));
  return <DashboardClient initialClients={clients} />;
}
