import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Dipanggil oleh deployment pelanggan (CORE) untuk mengetahui plan-nya.
 * Otentikasi: header x-master-key harus cocok dengan Client.apiKey.
 *
 * GET /api/license   (header: x-master-key: <apiKey>)
 *   → { plan, status, name }
 *
 * Tidak memerlukan login admin — ini panggilan mesin-ke-mesin yang
 * di-otentikasi oleh apiKey unik tiap pelanggan.
 */
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-master-key");
  if (!key) {
    return NextResponse.json({ error: "Missing x-master-key" }, { status: 401 });
  }

  const client = await prisma.client.findFirst({ where: { apiKey: key } });
  if (!client) {
    return NextResponse.json({ error: "Invalid license key" }, { status: 403 });
  }

  return NextResponse.json(
    {
      plan: client.plan,        // "basic" | "pro"
      status: client.status,    // "active" | "suspended"
      name: client.name,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
