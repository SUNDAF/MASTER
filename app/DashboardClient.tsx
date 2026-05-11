"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import {
  Globe, Plus, RefreshCw, ExternalLink, Trash2, LogOut,
  CheckCircle, XCircle, Clock, TrendingUp, Users, BookOpen, Map, MessageSquare, Pencil,
} from "lucide-react";

interface Client {
  id: string; name: string; url: string; plan: string;
  status: string; apiKey: string; notes?: string | null; createdAt: string;
}

interface Stats {
  tours: number; blogs: number; testimonials: number; users: number;
  lastActivity: string | null; error?: string;
}

const PLAN_COLORS: Record<string, string> = {
  basic: "bg-gray-100 text-gray-600",
  pro: "bg-blue-100 text-blue-700",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-600",
  expired: "bg-yellow-100 text-yellow-700",
};

function timeAgo(date: string | null) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}h lalu`;
  if (h > 0) return `${h}j lalu`;
  if (m > 0) return `${m}m lalu`;
  return "Baru saja";
}

function EditClientModal({ client, onClose, onSave }: {
  client: Client;
  onClose: () => void;
  onSave: (data: Partial<Client>) => void;
}) {
  const [form, setForm] = useState({ name: client.name, url: client.url, notes: client.notes ?? "", status: client.status });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-5">Edit Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Client</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Website</label>
            <input required value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://sundaftrip.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition">Batal</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientCard({ client, onDelete, onUpdate }: {
  client: Client;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Client>) => void;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/stats`);
      const data = await res.json();
      setStats(data);
    } catch {
      setStats({ tours: 0, blogs: 0, testimonials: 0, users: 0, lastActivity: null, error: "Tidak terhubung" });
    }
    setLoading(false);
  }, [client.id]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const isOnline = stats && !stats.error;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full mt-1 ${isOnline ? "bg-green-500" : loading ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
          <div>
            <h3 className="font-bold text-gray-900">{client.name}</h3>
            <a href={client.url} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              {client.url.replace("https://", "")} <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${PLAN_COLORS[client.plan] ?? PLAN_COLORS.basic}`}>
            {client.plan}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[client.status] ?? STATUS_COLORS.active}`}>
            {client.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      {stats?.error ? (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-4">
          <XCircle size={14} /> {stats.error}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { icon: Map, label: "Tour", value: stats.tours },
            { icon: BookOpen, label: "Blog", value: stats.blogs },
            { icon: MessageSquare, label: "Ulasan", value: stats.testimonials },
            { icon: Users, label: "User", value: stats.users },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <Icon size={14} className="mx-auto text-gray-400 mb-1" />
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          {stats?.lastActivity ? timeAgo(stats.lastActivity) : "—"}
        </div>
        <div className="flex items-center gap-2">
          {/* Plan toggle */}
          <select value={client.plan}
            onChange={e => onUpdate(client.id, { plan: e.target.value })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>

          {/* API Key */}
          <button onClick={() => setShowKey(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg border border-gray-200 hover:border-gray-300 transition">
            {showKey ? "Sembunyikan" : "API Key"}
          </button>

          <button onClick={() => setShowEdit(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition">
            <Pencil size={13} />
          </button>

          <button onClick={fetchStats} disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>

          <a href={`${client.url}/admin`} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition">
            <ExternalLink size={13} />
          </a>

          <button onClick={() => { if (confirm(`Hapus ${client.name}?`)) onDelete(client.id); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {showKey && (
        <div className="mt-3 bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1 font-medium">MASTER_API_KEY untuk {client.name}:</p>
          <code className="text-xs text-gray-700 break-all">{client.apiKey}</code>
        </div>
      )}

      {showEdit && (
        <EditClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSave={data => onUpdate(client.id, data)}
        />
      )}
    </div>
  );
}

function AddClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Client) => void }) {
  const [form, setForm] = useState({ name: "", url: "", plan: "basic", notes: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (data.id) { onAdd(data); onClose(); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-5">Tambah Client Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Client</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="OTe Family" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Website</label>
            <input required value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://ote.vercel.app" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Info tambahan..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition">Batal</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
              {loading ? "Menyimpan..." : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [showAdd, setShowAdd] = useState(false);

  async function handleDelete(id: string) {
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    setClients(c => c.filter(x => x.id !== id));
  }

  async function handleUpdate(id: string, data: Partial<Client>) {
    await fetch(`/api/clients/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setClients(c => c.map(x => x.id === id ? { ...x, ...data } : x));
  }

  const activeCount = clients.filter(c => c.status === "active").length;
  const proCount = clients.filter(c => c.plan === "pro").length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Master Dashboard</h1>
              <p className="text-xs text-gray-400">Travel CMS Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition">
              <Plus size={15} /> Tambah Client
            </button>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition">
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Client", value: clients.length, icon: Globe, color: "text-blue-600 bg-blue-50" },
            { label: "Aktif", value: activeCount, icon: CheckCircle, color: "text-green-600 bg-green-50" },
            { label: "Paket Pro", value: proCount, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Client grid */}
        {clients.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Globe size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Belum ada client</p>
            <p className="text-sm mt-1">Klik &quot;Tambah Client&quot; untuk memulai</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {clients.map(client => (
              <ClientCard key={client.id} client={client} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </main>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={c => setClients(p => [...p, c])} />}
    </div>
  );
}
