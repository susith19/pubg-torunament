"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faPen, faTrash, faEye, faMagnifyingGlass,
  faTrophy, faCircleDot, faUsersSlash, faLock, faXmark, faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

// ── types ──────────────────────────────────────────────────
type Tournament = {
  id: number; name: string; map: string; mode: string;
  platform: string; slots: number; filled: number;
  fee: string; status: string; date: string;
};
type FormData = Omit<Tournament, "id" | "filled">;

// ── data ───────────────────────────────────────────────────
const initialTournaments: Tournament[] = [
  { id: 1, name: "Erangel Squad Battle", map: "Erangel",   mode: "Squad", platform: "BGMI", slots: 100, filled: 45,  fee: "₹50",  status: "Open",   date: "Dec 1, 2026" },
  { id: 2, name: "Miramar Duo Clash",    map: "Miramar",   mode: "Duo",   platform: "PUBG", slots: 50,  filled: 50,  fee: "₹30",  status: "Full",   date: "Dec 1, 2026" },
  { id: 3, name: "Sanhok Solo Rush",     map: "Sanhok",    mode: "Solo",  platform: "BGMI", slots: 25,  filled: 18,  fee: "₹20",  status: "Open",   date: "Dec 2, 2026" },
  { id: 4, name: "TDM Arena",            map: "Warehouse", mode: "TDM",   platform: "PUBG", slots: 10,  filled: 9,   fee: "Free", status: "Closed", date: "Dec 3, 2026" },
  { id: 5, name: "Pro League S4",        map: "Erangel",   mode: "Squad", platform: "PUBG", slots: 100, filled: 90,  fee: "₹100", status: "Open",   date: "Dec 5, 2026" },
  { id: 6, name: "Rookie Rising",        map: "Erangel",   mode: "Solo",  platform: "BGMI", slots: 100, filled: 100, fee: "₹10",  status: "Full",   date: "Dec 6, 2026" },
];

const statusStyle: Record<string, string> = {
  Open:   "bg-green-500/10 text-green-400 border-green-500/20",
  Full:   "bg-red-500/10 text-red-400 border-red-500/20",
  Closed: "bg-gray-700/40 text-gray-500 border-gray-700",
  Live:   "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
};
const statusIcons: Record<string, any> = {
  Open: faCircleDot, Full: faUsersSlash, Closed: faLock, Live: faTrophy,
};

const MAPS     = ["Erangel", "Miramar", "Sanhok", "Vikendi", "Warehouse", "Livik"];
const MODES    = ["Solo", "Duo", "Squad", "TDM"];
const STATUSES = ["Open", "Full", "Closed", "Live"];

const emptyForm: FormData = { name: "", map: "Erangel", mode: "Squad", platform: "BGMI", slots: 100, fee: "₹50", status: "Open", date: "" };

// ── shared primitives ──────────────────────────────────────
const inputCls  = "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-colors duration-200";
const selectCls = "w-full appearance-none bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 text-xs text-white outline-none cursor-pointer transition-colors duration-200";

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
      <p className="text-sm tracking-wide text-white">{title}</p>
      <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1.5">{label}</p>
      {children}
    </div>
  );
}

// ── VIEW MODAL ────────────────────────────────────────────
function ViewModal({ t, onClose, onEdit }: { t: Tournament; onClose: () => void; onEdit: () => void }) {
  const percent = Math.round((t.filled / t.slots) * 100);
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Tournament Details" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <div className="w-10 h-10 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00] text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white tracking-wide truncate">{t.name}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{t.map} · {t.mode} · {t.platform}</p>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 flex-shrink-0 ${statusStyle[t.status]}`}>
            <FontAwesomeIcon icon={statusIcons[t.status]} className="text-[8px]" />
            {t.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Date",      val: t.date      },
            { label: "Entry Fee", val: t.fee       },
            { label: "Platform",  val: t.platform  },
            { label: "Mode",      val: t.mode      },
          ].map((r, i) => (
            <div key={i} className="bg-black border border-gray-800 rounded-lg px-3 py-2.5">
              <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1">{r.label}</p>
              <p className="text-xs text-white">{r.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-black border border-gray-800 rounded-lg px-3 py-3">
          <div className="flex justify-between text-[10px] text-gray-500 mb-2">
            <span>Slots Filled</span>
            <span>{t.filled} / {t.slots} · {percent}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`} style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">Close</button>
          <button onClick={onEdit} className="flex-1 border border-[#F2AA00]/40 text-[#F2AA00] py-2.5 text-xs tracking-widest rounded-lg hover:bg-[#F2AA00]/10 transition-all duration-150">
            <FontAwesomeIcon icon={faPen} className="mr-2 text-[9px]" />Edit
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── CREATE / EDIT MODAL ────────────────────────────────────
function TournamentFormModal({ initial, title, onSave, onClose }: { initial: FormData; title: string; onSave: (d: FormData) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormData>(initial);
  const set = (k: keyof FormData, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.name.trim() !== "" && form.date.trim() !== "";

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <div className="p-6 space-y-4 overflow-y-auto max-h-[72vh]">
        <Field label="Tournament Name">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Erangel Squad Battle" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Map">
            <select value={form.map} onChange={(e) => set("map", e.target.value)} className={selectCls}>
              {MAPS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Mode">
            <select value={form.mode} onChange={(e) => set("mode", e.target.value)} className={selectCls}>
              {MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform">
            <select value={form.platform} onChange={(e) => set("platform", e.target.value)} className={selectCls}>
              {["BGMI", "PUBG"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selectCls}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Total Slots">
            <input type="number" value={form.slots} onChange={(e) => set("slots", Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Entry Fee">
            <input value={form.fee} onChange={(e) => set("fee", e.target.value)} placeholder="₹50 or Free" className={inputCls} />
          </Field>
        </div>

        <Field label="Date">
          <input value={form.date} onChange={(e) => set("date", e.target.value)} placeholder="e.g. Dec 10, 2026" className={inputCls} />
        </Field>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">Cancel</button>
          <button
            onClick={() => valid && onSave(form)}
            className={`flex-1 py-2.5 text-xs tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] ${valid ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20" : "bg-gray-800/40 text-gray-600 border-gray-800 cursor-not-allowed"}`}
          >
            {title === "Create Tournament" ? "Create" : "Save Changes"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── DELETE MODAL ───────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Overlay onClose={onCancel}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <p className="text-sm tracking-wide text-white">Delete Tournament?</p>
          <button onClick={onCancel} className="text-gray-600 hover:text-white transition-colors"><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">You're about to delete <span className="text-white">"{name}"</span>. This action cannot be undone.</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 border border-gray-800 text-gray-400 py-2 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-2 text-xs tracking-widest rounded-lg hover:bg-red-500/20 active:scale-[0.97] transition-all duration-150">Delete</button>
        </div>
      </div>
    </Overlay>
  );
}

// ── MAIN ──────────────────────────────────────────────────
type ModalState =
  | { type: "view";   tournament: Tournament }
  | { type: "edit";   tournament: Tournament }
  | { type: "delete"; tournament: Tournament }
  | { type: "create" }
  | null;

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter, setModeFilter]   = useState("All");
  const [modal, setModal]             = useState<ModalState>(null);
  const [visible, setVisible]         = useState(false);
  const [barsActive, setBarsActive]   = useState(false);
  const [toast, setToast]             = useState({ msg: "", show: false });
  const [nextId, setNextId]           = useState(7);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(() => setBarsActive(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  const handleCreate = (data: FormData) => {
    setTournaments((p) => [{ ...data, id: nextId, filled: 0 }, ...p]);
    setNextId((n) => n + 1);
    setModal(null);
    showToast("Tournament created ✓");
  };

  const handleEdit = (data: FormData) => {
    if (modal?.type !== "edit") return;
    const id = modal.tournament.id;
    setTournaments((p) => p.map((t) => t.id === id ? { ...t, ...data } : t));
    setModal(null);
    showToast("Tournament updated ✓");
  };

  const handleDelete = (id: number) => {
    setTournaments((p) => p.filter((t) => t.id !== id));
    setModal(null);
    showToast("Tournament deleted");
  };

  const filtered = tournaments.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.name.toLowerCase().includes(q) || t.map.toLowerCase().includes(q)) &&
      (statusFilter === "All" || t.status === statusFilter) &&
      (modeFilter   === "All" || t.mode   === modeFilter)
    );
  });

  const total  = tournaments.length;
  const open   = tournaments.filter((t) => t.status === "Open").length;
  const full   = tournaments.filter((t) => t.status === "Full").length;
  const closed = tournaments.filter((t) => t.status === "Closed").length;

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {/* MODALS */}
      {modal?.type === "view" && (
        <ViewModal
          t={modal.tournament}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", tournament: modal.tournament })}
        />
      )}
      {modal?.type === "create" && (
        <TournamentFormModal title="Create Tournament" initial={emptyForm} onSave={handleCreate} onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit" && (
        <TournamentFormModal
          title="Edit Tournament"
          initial={{ name: modal.tournament.name, map: modal.tournament.map, mode: modal.tournament.mode, platform: modal.tournament.platform, slots: modal.tournament.slots, fee: modal.tournament.fee, status: modal.tournament.status, date: modal.tournament.date }}
          onSave={handleEdit}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal name={modal.tournament.name} onConfirm={() => handleDelete(modal.tournament.id)} onCancel={() => setModal(null)} />
      )}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <div>
            <h1 className="text-2xl tracking-widest text-white">Manage Tournaments</h1>
            <p className="text-gray-600 text-sm mt-1 tracking-wide">{total} tournaments total</p>
          </div>
          <button onClick={() => setModal({ type: "create" })} className="self-start sm:self-auto bg-[#F2AA00] text-black px-5 py-2.5 text-xs tracking-widest rounded-lg hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-[0.97] transition-all duration-150 flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Create Tournament
          </button>
        </div>

        {/* SUMMARY */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {[
            { label: "Total",  value: total,  color: "text-white"     },
            { label: "Open",   value: open,   color: "text-green-400" },
            { label: "Full",   value: full,   color: "text-red-400"   },
            { label: "Closed", value: closed, color: "text-gray-500"  },
          ].map((s, i) => (
            <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors duration-200">
              <p className="text-gray-600 text-[10px] tracking-widest uppercase">{s.label}</p>
              <p className={`text-xl mt-1 font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTERS */}
        <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "160ms" }}>
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or map..." className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-colors duration-200" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer">
              {["All", "Open", "Full", "Closed", "Live"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none" />
          </div>
          <div className="relative">
            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer">
              {["All", "Solo", "Duo", "Squad", "TDM"].map((m) => <option key={m}>{m}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none" />
          </div>
        </div>

        {/* TABLE */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "240ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["Tournament", "Date", "Platform", "Mode", "Fee", "Slots", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-[15px] text-gray-600 tracking-widest px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-14 text-gray-700 text-sm tracking-widest">No tournaments match your filters.</td></tr>
                ) : (
                  filtered.map((t, i) => {
                    const percent = Math.round((t.filled / t.slots) * 100);
                    return (
                      <tr key={t.id} className={`border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`} style={{ transitionDelay: `${320 + i * 50}ms` }}>

                        <td className="px-4 py-3.5">
                          <p className="text-md text-white tracking-widest group-hover:text-[#F2AA00] transition-colors duration-200">{t.name}</p>
                          <p className="text-[12px] text-gray-600 mt-0.5">{t.map}</p>
                        </td>
                        <td className="px-4 py-3.5 text-[15px] text-gray-500">{t.date}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[13px] px-2 py-0.5 rounded-md border tracking-wide ${t.platform === "BGMI" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>{t.platform}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[13px] px-2 py-0.5 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10 tracking-wide">{t.mode}</span>
                        </td>
                        <td className="px-4 py-3.5 text-[14px] text-[#F2AA00]/70">{t.fee}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1 w-20">
                            <div className="flex justify-between text-[14px] text-gray-600"><span>{t.filled}</span><span>{t.slots}</span></div>
                            <div className="h-[3px] bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`} style={{ width: barsActive ? `${percent}%` : "0%", transitionDelay: `${i * 50}ms` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[13px] px-2.5 py-1 rounded-md border tracking-wide flex items-center gap-1.5 w-fit ${statusStyle[t.status]}`}>
                            <FontAwesomeIcon icon={statusIcons[t.status]} className="text-[8px]" />
                            {t.status}
                          </span>
                        </td>

                        {/* ── ACTIONS ── */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setModal({ type: "view", tournament: t })}
                              title="View details"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-all duration-150"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-[9px]" />
                            </button>
                            <button
                              onClick={() => setModal({ type: "edit", tournament: t })}
                              title="Edit tournament"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-[#F2AA00]/50 hover:text-[#F2AA00] transition-all duration-150"
                            >
                              <FontAwesomeIcon icon={faPen} className="text-[9px]" />
                            </button>
                            <button
                              onClick={() => setModal({ type: "delete", tournament: t })}
                              title="Delete tournament"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-red-500/40 hover:text-red-400 transition-all duration-150"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-[9px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-800 flex justify-between items-center">
            <p className="text-[14px] text-gray-700 tracking-wide">Showing {filtered.length} of {total} tournaments</p>
            <div className="flex gap-1.5">
              {["1","2","3"].map((p) => (
                <button key={p} className={`w-6 h-6 text-[10px] rounded-md border transition-all duration-150 ${p === "1" ? "bg-[#F2AA00] text-black border-[#F2AA00]" : "border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400"}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}