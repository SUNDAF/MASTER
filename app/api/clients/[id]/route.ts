import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyClient } from "@/lib/notify";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const before = await prisma.client.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: body.name,
      url: body.url?.replace(/\/$/, ""),
      plan: body.plan,
      status: body.status,
      notes: body.notes,
      ...(body.vercelProjectId !== undefined ? { vercelProjectId: body.vercelProjectId || null } : {}),
    },
  });

  // Kalau plan atau status berubah, beri tahu deployment pelanggan agar
  // CORE me-revalidate cache license-nya seketika (tanpa redeploy).
  const planChanged = body.plan !== undefined && body.plan !== before.plan;
  const statusChanged = body.status !== undefined && body.status !== before.status;
  let webhook: { ok: boolean; error?: string } | null = null;
  if (planChanged || statusChanged) {
    webhook = await notifyClient(client.url, client.apiKey);
  }

  return NextResponse.json({ ...client, webhook });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
