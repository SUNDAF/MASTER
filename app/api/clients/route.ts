import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const apiKey = crypto.randomBytes(32).toString("hex");
  const client = await prisma.client.create({
    data: { name: body.name, url: body.url.replace(/\/$/, ""), plan: body.plan ?? "basic", apiKey, notes: body.notes ?? "", vercelProjectId: body.vercelProjectId ?? null },
  });
  return NextResponse.json(client);
}
