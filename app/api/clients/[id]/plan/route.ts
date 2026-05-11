import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function vercelSetPlan(projectId: string, plan: string) {
  const token = process.env.VERCEL_TOKEN;
  if (!token || !projectId) return { ok: false, error: "VERCEL_TOKEN atau Project ID belum diset" };

  const targets = ["production", "preview"];

  // Get existing env vars
  const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  const existing = listData.envs?.find((e: { key: string }) => e.key === "NEXT_PUBLIC_PLAN");

  if (existing) {
    // Update existing
    const updateRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ value: plan, target: targets }),
    });
    if (!updateRes.ok) return { ok: false, error: "Gagal update env var" };
  } else {
    // Create new
    const createRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ key: "NEXT_PUBLIC_PLAN", value: plan, type: "plain", target: targets }),
    });
    if (!createRes.ok) return { ok: false, error: "Gagal buat env var" };
  }

  // Trigger redeploy
  const deployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: projectId, target: "production", gitSource: { type: "github", ref: "main" } }),
  });

  return { ok: true, redeployed: deployRes.ok };
}

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

  // Update DB
  await prisma.client.update({ where: { id }, data: { plan } });

  // Sync to Vercel if projectId exists
  if (client.vercelProjectId) {
    const result = await vercelSetPlan(client.vercelProjectId, plan);
    return NextResponse.json({ success: true, vercel: result });
  }

  return NextResponse.json({ success: true, vercel: null });
}
