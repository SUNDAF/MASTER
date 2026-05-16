import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyClient } from "@/lib/notify";

/**
 * Ubah plan pelanggan — instan, tanpa redeploy.
 *
 * POST /api/clients/[id]/plan   body: { plan: "basic" | "pro" }
 *
 * 1. Update DB MASTER.
 * 2. Ping webhook deployment pelanggan → CORE me-revalidate cache license.
 *    Pelanggan langsung melihat perubahan dalam hitungan detik.
 *    Kalau webhook gagal (deployment down), perubahan tetap tersimpan dan
 *    CORE akan menariknya sendiri lewat polling 5 menit.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { plan } = await req.json();

  if (!["basic", "pro"].includes(plan)) {
    return NextResponse.json({ error: "Plan tidak valid" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 404 });

  await prisma.client.update({ where: { id }, data: { plan } });

  const webhook = await notifyClient(client.url, client.apiKey);

  return NextResponse.json({
    success: true,
    plan,
    webhook, // { ok: true } instan; { ok: false } → pelanggan tetap update via polling
  });
}
