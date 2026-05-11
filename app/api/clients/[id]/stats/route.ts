import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const res = await fetch(`${client.url}/api/master/stats`, {
      headers: { "x-master-key": client.apiKey },
      next: { revalidate: 0 },
    });
    if (!res.ok) return NextResponse.json({ error: "Client unreachable" }, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Client unreachable" }, { status: 502 });
  }
}
