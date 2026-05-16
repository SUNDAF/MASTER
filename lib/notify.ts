/**
 * Memberi tahu deployment pelanggan (CORE) bahwa plan/status berubah,
 * sehingga CORE me-revalidate cache license-nya seketika — tanpa redeploy.
 *
 * CORE meng-otentikasi panggilan ini lewat header x-master-key yang
 * harus cocok dengan MASTER_API_KEY (= Client.apiKey) di deployment tsb.
 */
export async function notifyClient(
  url: string,
  apiKey: string
): Promise<{ ok: boolean; error?: string }> {
  if (!url || !apiKey) return { ok: false, error: "URL atau apiKey kosong" };

  const target = `${url.replace(/\/$/, "")}/api/master/revalidate-license`;

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "x-master-key": apiKey },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unreachable" };
  }
}
