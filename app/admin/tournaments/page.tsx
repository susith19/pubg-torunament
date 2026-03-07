"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faPen, faTrash, faEye, faMagnifyingGlass,
  faTrophy, faCircleDot, faUsersSlash, faLock, faXmark,
  faChevronDown, faKey, faDoorOpen, faCoins,
  faFloppyDisk, faRotateLeft, faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

// ── types ──────────────────────────────────────────────────
type Tournament = {
  id:       number;
  name:     string;
  map:      string;
  mode:     string;
  platform: string;
  slots:    number;
  filled:   number;
  fee:      string;
  status:   string;
  date:     string;
  rawDate:  string;
  roomId:   string | null;
  roomPass: string | null;
  // per-mode fees
  feeSolo:  number;
  feeDuo:   number;
  feeSquad: number;
  prizePool: number;
};

type FormData = {
  name:      string;
  map:       string;
  mode:      string;
  platform:  string;
  slots:     number;
  fee:       string;   // legacy single fee (kept for display)
  feeSolo:   number;
  feeDuo:    number;
  feeSquad:  number;
  status:    string;
  date:      string;
  time:      string;
  prizePool: string;
};

// ── Hardcoded fallback (used before localStorage loads) ───
const FACTORY_DEFAULTS = { feeSolo: 50, feeDuo: 100, feeSquad: 150 };
// Keep alias so existing references compile
const DEFAULT_FEES = FACTORY_DEFAULTS;

const statusStyle: Record<string, string> = {
  Open:   "bg-green-500/10 text-green-400 border-green-500/20",
  Full:   "bg-red-500/10 text-red-400 border-red-500/20",
  Closed: "bg-gray-700/40 text-gray-500 border-gray-700",
  Live:   "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
};
const statusIcons: Record<string, any> = {
  Open:   faCircleDot,
  Full:   faUsersSlash,
  Closed: faLock,
  Live:   faTrophy,
};

const MAPS     = ["Erangel", "Miramar", "Sanhok", "Vikendi", "Rondo", "Warehouse", "Livik"];
const MODES    = ["Solo", "Duo", "Squad"];
const STATUSES = ["Open", "Full", "Closed", "Live"];

const inputCls  = "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 text-md text-white placeholder-gray-600 outline-none transition-colors duration-200";
const selectCls = "w-full appearance-none bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 text-md text-white outline-none cursor-pointer transition-colors duration-200";

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const authFetch = async (url: string, options: any = {}) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
};

function toISO(date: string, time: string): string {
  if (!date) return new Date().toISOString();
  const iso = `${date}T${time || "00:00"}:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function splitRawDate(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "18:00" };
  try {
    const d = new Date(iso.replace(" ", "T"));
    return { date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) };
  } catch { return { date: "", time: "18:00" }; }
}

function fmtDisplay(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso.replace(" ", "T")).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch { return iso; }
}

// active fee for current mode
function activeFee(form: FormData): number {
  const m = form.mode.toLowerCase();
  if (m === "solo")  return form.feeSolo;
  if (m === "duo")   return form.feeDuo;
  return form.feeSquad;
}

// ── PRIMITIVES ─────────────────────────────────────────────
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
      <p className="text-md tracking-wide text-white">{title}</p>
      <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors"><FontAwesomeIcon icon={faXmark} /></button>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-md text-gray-600 tracking-widest uppercase mb-1.5">{label}</p>
      {children}
    </div>
  );
}

// ── PER-MODE FEES EDITOR ───────────────────────────────────
function FeesEditor({ form, set }: {
  form: FormData;
  set: (k: keyof FormData, v: any) => void;
}) {
  const fees = [
    { label: "Solo",  key: "feeSolo"  as const, default: DEFAULT_FEES.feeSolo  },
    { label: "Duo",   key: "feeDuo"   as const, default: DEFAULT_FEES.feeDuo   },
    { label: "Squad", key: "feeSquad" as const, default: DEFAULT_FEES.feeSquad },
  ];

  return (
    <div className="bg-black border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <FontAwesomeIcon icon={faCoins} className="text-[#F2AA00]/60 text-md" />
        <p className="text-md text-gray-600 tracking-widest uppercase">Entry Fees by Mode</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {fees.map(({ label, key, default: def }) => {
          const isActive = form.mode.toLowerCase() === label.toLowerCase();
          return (
            <div
              key={key}
              className={`rounded-lg border p-2.5 transition-all duration-150 ${
                isActive
                  ? "border-[#F2AA00]/40 bg-[#F2AA00]/5"
                  : "border-gray-800 bg-black"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] tracking-widest uppercase ${isActive ? "text-[#F2AA00]" : "text-gray-600"}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="text-[8px] text-[#F2AA00] border border-[#F2AA00]/30 px-1 py-0.5 rounded tracking-widest">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-md">₹</span>
                <input
                  type="number"
                  min={0}
                  value={form[key]}
                  onChange={(e) => set(key, Number(e.target.value))}
                  className={`w-full bg-transparent border rounded px-5 py-1.5 text-md font-mono outline-none transition-colors ${
                    isActive
                      ? "border-[#F2AA00]/30 text-[#F2AA00] focus:border-[#F2AA00]"
                      : "border-gray-800 text-gray-400 focus:border-gray-600"
                  }`}
                />
              </div>
              <button
                onClick={() => set(key, def)}
                className="text-md text-gray-700 hover:text-gray-500 mt-1 tracking-widest transition-colors"
              >
                reset to ₹{def}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-800">
        <span className="text-[10px] text-gray-600 tracking-widest uppercase">Current tournament fee</span>
        <span className="text-[#F2AA00] font-mono text-md">
          ₹{activeFee(form)} <span className="text-gray-600 text-[10px] capitalize">({form.mode})</span>
        </span>
      </div>
    </div>
  );
}

// ── VIEW MODAL ─────────────────────────────────────────────
function ViewModal({ t, onClose, onEdit, onRoomEdit }: {
  t: Tournament; onClose: () => void; onEdit: () => void; onRoomEdit: () => void;
}) {
  const percent = t.slots > 0 ? Math.round((t.filled / t.slots) * 100) : 0;
  const isLive  = t.status === "Live";

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Tournament Details" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <div className="w-10 h-10 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-md text-white tracking-wide truncate">{t.name}</p>
            <p className="text-md text-gray-600 mt-0.5">{t.map} · {t.mode} · {t.platform}</p>
          </div>
          <span className={`text-md px-2.5 py-1 rounded-md border flex items-center gap-1.5 flex-shrink-0 ${statusStyle[t.status]}`}>
            <FontAwesomeIcon icon={statusIcons[t.status]} className="text-[8px]" />{t.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Start Date & Time", val: t.date },
            { label: "Entry Fee",         val: t.fee  },
            { label: "Platform",          val: t.platform },
            { label: "Mode",              val: t.mode },
          ].map((r, i) => (
            <div key={i} className="bg-black border border-gray-800 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">{r.label}</p>
              <p className="text-md text-white">{r.val}</p>
            </div>
          ))}
        </div>

        {/* Per-mode fees display */}
        <div className="bg-black border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-2.5">Entry Fees by Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Solo",  val: t.feeSolo  },
              { label: "Duo",   val: t.feeDuo   },
              { label: "Squad", val: t.feeSquad },
            ].map(({ label, val }) => {
              const isActive = t.mode.toLowerCase() === label.toLowerCase();
              return (
                <div key={label} className={`rounded-lg border px-2.5 py-2 text-center ${isActive ? "border-[#F2AA00]/30 bg-[#F2AA00]/5" : "border-gray-800"}`}>
                  <p className={`text-md tracking-widest uppercase mb-1 ${isActive ? "text-[#F2AA00]" : "text-gray-600"}`}>{label}</p>
                  <p className={`font-mono text-md ${isActive ? "text-[#F2AA00]" : "text-gray-500"}`}>₹{val}</p>
                </div>
              );
            })}
          </div>
        </div>

        {isLive && (
          <div className={`rounded-xl border px-4 py-3.5 space-y-2.5 ${t.roomId ? "border-[#F2AA00]/30 bg-[#F2AA00]/5" : "border-gray-800 bg-black"}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">Room Info</p>
              {!t.roomId && <span className="text-[10px] text-[#F2AA00] border border-[#F2AA00]/30 bg-[#F2AA00]/10 px-2 py-0.5 rounded-full">Not set</span>}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">Room ID</p>
                <p className={`text-md font-mono ${t.roomId ? "text-[#F2AA00]" : "text-gray-700"}`}>{t.roomId || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">Password</p>
                <p className={`text-md font-mono ${t.roomPass ? "text-[#F2AA00]" : "text-gray-700"}`}>{t.roomPass || "—"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-black border border-gray-800 rounded-lg px-3 py-3">
          <div className="flex justify-between text-md text-gray-500 mb-2">
            <span>Slots Filled</span>
            <span>{t.filled} / {t.slots} · {percent}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`} style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-md tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">Close</button>
          {isLive && (
            <button onClick={onRoomEdit} className="flex-1 border border-[#F2AA00]/40 text-[#F2AA00] py-2.5 text-md tracking-widest rounded-lg hover:bg-[#F2AA00]/10 transition-all duration-150">
              <FontAwesomeIcon icon={faKey} className="mr-1.5" />{t.roomId ? "Update Room" : "Set Room"}
            </button>
          )}
          <button onClick={onEdit} className="flex-1 border border-gray-700 text-gray-300 py-2.5 text-md tracking-widest rounded-lg hover:border-[#F2AA00]/40 hover:text-[#F2AA00] transition-all duration-150">
            <FontAwesomeIcon icon={faPen} className="mr-1.5" />Edit
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── ROOM MODAL ─────────────────────────────────────────────
function RoomModal({ t, onSave, onClose }: { t: Tournament; onSave: (id: string, pass: string) => void; onClose: () => void }) {
  const [roomId,   setRoomId]   = useState(t.roomId   ?? "");
  const [roomPass, setRoomPass] = useState(t.roomPass ?? "");
  const valid = roomId.trim() !== "";
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Set Room ID & Password" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 bg-[#F2AA00]/5 border border-[#F2AA00]/20 rounded-xl px-4 py-3">
          <FontAwesomeIcon icon={faDoorOpen} className="text-[#F2AA00] flex-shrink-0" />
          <div>
            <p className="text-md text-white">{t.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Players will see this room info to join</p>
          </div>
        </div>
        <Field label="Room ID">
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="e.g. 7482910" className={inputCls + " font-mono tracking-widest"} />
        </Field>
        <Field label="Room Password">
          <input value={roomPass} onChange={(e) => setRoomPass(e.target.value)} placeholder="e.g. squad123" className={inputCls + " font-mono tracking-widest"} />
          <p className="text-[10px] text-gray-700 mt-1.5">Leave blank for no password</p>
        </Field>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-md tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">Cancel</button>
          <button onClick={() => valid && onSave(roomId.trim(), roomPass.trim())} className={`flex-1 py-2.5 text-md tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] ${valid ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00]" : "bg-gray-800/40 text-gray-600 border-gray-800 cursor-not-allowed"}`}>
            Save Room Info
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── CREATE / EDIT MODAL ────────────────────────────────────
function TournamentFormModal({ initial, title, onSave, onClose }: {
  initial: FormData; title: string;
  onSave: (d: FormData) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const set = (k: keyof FormData, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.name.trim() !== "" && form.date.trim() !== "";

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">

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

        {/* ── PER-MODE FEES ─────────────────────── */}
        <FeesEditor form={form} set={set} />

        {/* ── DATE + TIME ─────────────────────────── */}
        <div className="bg-black border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-md text-gray-600 tracking-widest uppercase">Start Date & Time</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-700 tracking-widest uppercase mb-1.5">Date</p>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls + " [color-scheme:dark]"} />
            </div>
            <div>
              <p className="text-[10px] text-gray-700 tracking-widest uppercase mb-1.5">Time</p>
              <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className={inputCls + " [color-scheme:dark]"} />
            </div>
          </div>
          {form.date && (
            <p className="text-[10px] text-[#F2AA00]/60">
              {new Date(`${form.date}T${form.time}:00`).toLocaleString("en-IN", {
                weekday: "short", day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true,
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Total Slots">
            <input type="number" value={form.slots} onChange={(e) => set("slots", Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Prize Pool (₹)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-md">₹</span>
              <input value={form.prizePool} onChange={(e) => set("prizePool", e.target.value)} placeholder="0" className={inputCls + " pl-7"} />
            </div>
          </Field>
        </div>

        {form.status === "Live" && (
          <div className="flex items-start gap-2.5 bg-[#F2AA00]/5 border border-[#F2AA00]/20 rounded-xl px-4 py-3">
            <FontAwesomeIcon icon={faKey} className="text-[#F2AA00] flex-shrink-0 mt-0.5" />
            <p className="text-md text-gray-400 leading-relaxed">
              Tournament is <span className="text-[#F2AA00]">Live</span>. After saving, set Room ID & Password from the View modal.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-md tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">Cancel</button>
          <button
            onClick={() => valid && onSave(form)}
            className={`flex-1 py-2.5 text-md tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] ${valid ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20" : "bg-gray-800/40 text-gray-600 border-gray-800 cursor-not-allowed"}`}
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
          <p className="text-md tracking-wide text-white">Delete Tournament?</p>
          <button onClick={onCancel} className="text-gray-600 hover:text-white transition-colors"><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <p className="text-md text-gray-500 leading-relaxed">
          You're about to delete <span className="text-white">"{name}"</span>. This action cannot be undone.
        </p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 border border-gray-800 text-gray-400 py-2 text-md tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-2 text-md tracking-widest rounded-lg hover:bg-red-500/20 active:scale-[0.97] transition-all duration-150">Delete</button>
        </div>
      </div>
    </Overlay>
  );
}

// ── DEFAULT FEES CARD ──────────────────────────────────────
// Shown inline on the tournament page — saves to localStorage
// so new tournaments always pre-fill with the latest defaults.
type DefaultFees = { feeSolo: number; feeDuo: number; feeSquad: number };

const LS_KEY = "tournament_default_fees";

function loadDefaultFees(): DefaultFees {
  if (typeof window === "undefined") return FACTORY_DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...FACTORY_DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return FACTORY_DEFAULTS;
}

function DefaultFeesCard({
  defaults,
  onSave,
}: {
  defaults: DefaultFees;
  onSave: (d: DefaultFees) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [draft,   setDraft]   = useState<DefaultFees>(defaults);
  const [saved,   setSaved]   = useState(false);

  // sync draft when parent defaults change (e.g. on first load)
  useEffect(() => { setDraft(defaults); }, [defaults]);

  const isDirty =
    draft.feeSolo  !== defaults.feeSolo  ||
    draft.feeDuo   !== defaults.feeDuo   ||
    draft.feeSquad !== defaults.feeSquad;

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setDraft(FACTORY_DEFAULTS);
  };

  const modes = [
    { key: "feeSolo"  as const, label: "Solo",  color: "text-blue-400",   border: "border-blue-500/20",   bg: "bg-blue-500/5"   },
    { key: "feeDuo"   as const, label: "Duo",   color: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/5" },
    { key: "feeSquad" as const, label: "Squad", color: "text-[#F2AA00]",  border: "border-[#F2AA00]/20",  bg: "bg-[#F2AA00]/5"  },
  ];

  return (
    <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-colors duration-200 hover:border-gray-700">

      {/* ── collapsed header — always visible ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faCoins} className="text-[#F2AA00] text-[10px]" />
          </div>
          <div>
            <p className="text-md text-white tracking-wide">Default Entry Fees</p>
            <p className="text-[10px] text-gray-600 mt-0.5 tracking-wide">
              Auto-filled when creating new tournaments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* preview pills — always visible */}
          <div className="hidden sm:flex items-center gap-2">
            {modes.map(({ key, label, color }) => (
              <span key={key} className="text-[10px] font-mono tracking-wide">
                <span className="text-gray-600">{label} </span>
                <span className={color}>₹{defaults[key]}</span>
              </span>
            ))}
          </div>
          <FontAwesomeIcon
            icon={open ? faChevronUp : faChevronDown}
            className="text-gray-600 text-[10px] transition-transform duration-200"
          />
        </div>
      </button>

      {/* ── expanded editor ── */}
      {open && (
        <div className="border-t border-gray-800 px-5 py-4 space-y-4">

          <p className="text-md text-gray-500 leading-relaxed">
            These values pre-fill the fees when you create a new tournament.
            Each tournament can still be customised individually after creation.
          </p>

          {/* Fee inputs */}
          <div className="grid grid-cols-3 gap-3">
            {modes.map(({ key, label, color, border, bg }) => (
              <div key={key} className={`rounded-xl border ${border} ${bg} p-3`}>
                <p className={`text-[10px] tracking-widest uppercase mb-2 ${color}`}>{label}</p>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-md">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [key]: Math.max(0, Number(e.target.value)) }))
                    }
                    className={`w-full bg-black/60 border rounded-lg pl-6 pr-2 py-2 text-md font-mono outline-none transition-colors ${
                      draft[key] !== defaults[key]
                        ? `${border} ${color}`
                        : "border-gray-800 text-white"
                    } focus:border-[#F2AA00]/40`}
                  />
                </div>
                {draft[key] !== FACTORY_DEFAULTS[key] && (
                  <button
                    onClick={() => setDraft((d) => ({ ...d, [key]: FACTORY_DEFAULTS[key] }))}
                    className="text-md text-gray-700 hover:text-gray-500 mt-1.5 tracking-widest transition-colors"
                  >
                    reset to ₹{FACTORY_DEFAULTS[key]}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Change summary */}
          {isDirty && (
            <div className="flex flex-wrap gap-2 text-[10px]">
              {modes.map(({ key, label, color }) =>
                draft[key] !== defaults[key] ? (
                  <span key={key} className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-full px-2.5 py-1">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-700 line-through font-mono">₹{defaults[key]}</span>
                    <span className="text-gray-500">→</span>
                    <span className={`font-mono ${color}`}>₹{draft[key]}</span>
                  </span>
                ) : null
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              disabled={
                draft.feeSolo  === FACTORY_DEFAULTS.feeSolo &&
                draft.feeDuo   === FACTORY_DEFAULTS.feeDuo  &&
                draft.feeSquad === FACTORY_DEFAULTS.feeSquad
              }
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-widest rounded-lg border border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="text-md" />
              Reset all
            </button>

            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] ${
                saved
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : isDirty
                  ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00]"
                  : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="text-md" />
              {saved ? "Saved!" : "Save defaults"}
            </button>

            <span className="text-md text-gray-700 ml-auto tracking-wide">
              Stored in browser · affects new tournaments only
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────
type ModalState =
  | { type: "view";   tournament: Tournament }
  | { type: "edit";   tournament: Tournament }
  | { type: "delete"; tournament: Tournament }
  | { type: "room";   tournament: Tournament }
  | { type: "create" }
  | null;

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search,       setSearch]      = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter,   setModeFilter]   = useState("All");
  const [modal,        setModal]        = useState<ModalState>(null);
  const [visible,      setVisible]      = useState(false);
  const [barsActive,   setBarsActive]   = useState(false);
  const [toast,        setToast]        = useState({ msg: "", show: false });
  const [defaultFees,  setDefaultFees]  = useState<DefaultFees>(FACTORY_DEFAULTS);

  // Load saved defaults from localStorage on mount
  useEffect(() => { setDefaultFees(loadDefaultFees()); }, []);

  useEffect(() => { fetchTournaments(); }, []);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(() => setBarsActive(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  const fetchTournaments = async () => {
    try {
      const res  = await fetch("/api/admin/tournaments", { cache: "no-store" });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      const formatted: Tournament[] = data.map((t: any) => {
        const raw = t.start_date ?? "";
        const mode = capitalize(t.mode);
        // derive active fee from per-mode fees
        const feeSolo  = t.fee_solo  ?? DEFAULT_FEES.feeSolo;
        const feeDuo   = t.fee_duo   ?? DEFAULT_FEES.feeDuo;
        const feeSquad = t.fee_squad ?? DEFAULT_FEES.feeSquad;
        const activeEntryFee =
          t.mode === "solo" ? feeSolo :
          t.mode === "duo"  ? feeDuo  : feeSquad;

        return {
          id:       t.id,
          name:     t.title,
          map:      t.map,
          mode,
          platform: t.game === "PUBG" ? "PUBG" : "BGMI",
          slots:    t.total_slots,
          // Fix: count registrations not players
          filled:   t.filled_slots ?? t._count?.registrations ?? 0,
          fee:      activeEntryFee === 0 ? "Free" : `₹${activeEntryFee}`,
          status:   capitalize(t.status),
          date:     fmtDisplay(raw),
          rawDate:  raw,
          roomId:   t.room_id   ?? null,
          roomPass: t.room_pass ?? null,
          feeSolo,
          feeDuo,
          feeSquad,
          prizePool: Number(t.prize_pool) || 0,
        };
      });
      setTournaments(formatted);
    } catch (err) { console.error("Fetch error:", err); }
  };

  const handleDefaultFeesSave = (d: DefaultFees) => {
    localStorage.setItem(LS_KEY, JSON.stringify(d));
    setDefaultFees(d);
    showToast("Default fees updated ✓");
  };

  // emptyForm always uses current defaultFees
  const buildEmptyForm = (): FormData => ({
    name: "", map: "Erangel", mode: "Squad", platform: "BGMI",
    slots: 100, fee: String(defaultFees.feeSquad),
    feeSolo:  defaultFees.feeSolo,
    feeDuo:   defaultFees.feeDuo,
    feeSquad: defaultFees.feeSquad,
    status: "Open", date: "", time: "18:00", prizePool: "0",
  });
  const buildPayload = (data: FormData) => ({
    title:       data.name,
    game:        data.platform === "PUBG" ? "PUBG" : "BGMI",
    mode:        data.mode.toLowerCase(),
    map:         data.map,
    entry_fee:   activeFee(data),   // active mode fee as the main entry_fee
    fee_solo:    data.feeSolo,
    fee_duo:     data.feeDuo,
    fee_squad:   data.feeSquad,
    prize_pool:  Number(data.prizePool) || 0,
    total_slots: data.slots,
    start_date:  toISO(data.date, data.time),
    status:      data.status.toLowerCase(),
  });

  const handleCreate = async (data: FormData) => {
    try {
      await authFetch("/api/admin/tournaments", { method: "POST", body: JSON.stringify(buildPayload(data)) });
      await fetchTournaments();
      setModal(null);
      showToast("Tournament created ✓");
    } catch (err) { console.error(err); }
  };

  const handleEdit = async (data: FormData) => {
    if (modal?.type !== "edit") return;
    try {
      await authFetch(`/api/admin/tournaments/${modal.tournament.id}`, { method: "PUT", body: JSON.stringify(buildPayload(data)) });
      await fetchTournaments();
      setModal(null);
      showToast("Tournament updated ✓");
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    try {
      await authFetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
      await fetchTournaments();
      setModal(null);
      showToast("Tournament deleted");
    } catch (err) { console.error(err); }
  };

  const handleRoomSave = async (roomId: string, roomPass: string) => {
    if (modal?.type !== "room") return;
    try {
      await authFetch(`/api/admin/tournaments/${modal.tournament.id}`, { method: "PUT", body: JSON.stringify({ room_id: roomId, room_pass: roomPass }) });
      await fetchTournaments();
      setModal(null);
      showToast("Room info saved ✓");
    } catch (err) { console.error(err); }
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
  const live   = tournaments.filter((t) => t.status === "Live").length;
  const full   = tournaments.filter((t) => t.status === "Full").length;
  const closed = tournaments.filter((t) => t.status === "Closed").length;

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">

      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-md px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {/* MODALS */}
      {modal?.type === "view" && (
        <ViewModal t={modal.tournament} onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", tournament: modal.tournament })}
          onRoomEdit={() => setModal({ type: "room", tournament: modal.tournament })} />
      )}
      {modal?.type === "room" && (
        <RoomModal t={modal.tournament} onSave={handleRoomSave} onClose={() => setModal(null)} />
      )}
      {modal?.type === "create" && (
        <TournamentFormModal title="Create Tournament" initial={buildEmptyForm()} onSave={handleCreate} onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit" && (() => {
        const { date, time } = splitRawDate(modal.tournament.rawDate);
        return (
          <TournamentFormModal
            title="Edit Tournament"
            initial={{
              name:      modal.tournament.name,
              map:       modal.tournament.map,
              mode:      modal.tournament.mode,
              platform:  modal.tournament.platform,
              slots:     modal.tournament.slots,
              fee:       String(modal.tournament.feeSolo),
              feeSolo:   modal.tournament.feeSolo,
              feeDuo:    modal.tournament.feeDuo,
              feeSquad:  modal.tournament.feeSquad,
              status:    modal.tournament.status,
              prizePool: String(modal.tournament.prizePool),
              date, time,
            }}
            onSave={handleEdit}
            onClose={() => setModal(null)}
          />
        );
      })()}
      {modal?.type === "delete" && (
        <DeleteModal name={modal.tournament.name} onConfirm={() => handleDelete(modal.tournament.id)} onCancel={() => setModal(null)} />
      )}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <div>
            <h1 className="text-xl tracking-widest text-white">Manage Tournaments</h1>
            <p className="text-gray-600 text-md mt-1 tracking-wide">{total} tournaments total</p>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="self-start sm:self-auto bg-[#F2AA00] text-black px-5 py-2.5 text-md tracking-widest rounded-lg hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-[0.97] transition-all duration-150 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} className="text-md" />
            Create Tournament
          </button>
        </div>

        {/* DEFAULT FEES CARD */}
        <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "60ms" }}>
          <DefaultFeesCard defaults={defaultFees} onSave={handleDefaultFeesSave} />
        </div>

        {/* SUMMARY */}
        <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {[
            { label: "Total",  value: total,  color: "text-white"     },
            { label: "Open",   value: open,   color: "text-green-400" },
            { label: "Live",   value: live,   color: "text-[#F2AA00]" },
            { label: "Full",   value: full,   color: "text-red-400"   },
            { label: "Closed", value: closed, color: "text-gray-500"  },
          ].map((s, i) => (
            <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors duration-200">
              <p className="text-gray-600 text-md tracking-widest uppercase">{s.label}</p>
              <p className={`text-xl mt-1 font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "160ms" }}>
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-md" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or map..."
              className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-md text-white placeholder-gray-600 outline-none transition-colors duration-200" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-md text-gray-400 outline-none cursor-pointer">
              {["All", "Open", "Live", "Full", "Closed"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-md pointer-events-none" />
          </div>
          <div className="relative">
            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-md text-gray-400 outline-none cursor-pointer">
              {["All", "Solo", "Duo", "Squad"].map((m) => <option key={m}>{m}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-md pointer-events-none" />
          </div>
        </div>

        {/* TABLE */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "240ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["Tournament", "Start", "Platform", "Mode", "Fees (S/D/Q)", "Slots", "Status", "Room", "Actions"].map((h) => (
                    <th key={h} className="text-md text-gray-600 tracking-widest px-4 py-3 text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-14 text-gray-700 text-md tracking-widest">No tournaments match your filters.</td>
                  </tr>
                ) : filtered.map((t, i) => {
                  const percent = t.slots > 0 ? Math.round((t.filled / t.slots) * 100) : 0;
                  const isLive  = t.status === "Live";
                  return (
                    <tr key={t.id}
                      className={`border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                      style={{ transitionDelay: `${320 + i * 50}ms` }}
                    >
                      {/* NAME */}
                      <td className="px-4 py-3.5">
                        <p className="text-md text-white group-hover:text-[#F2AA00] transition-colors duration-200">{t.name}</p>
                        <p className="text-md text-gray-600 mt-0.5">{t.map}</p>
                      </td>
                      {/* DATE */}
                      <td className="px-4 py-3.5 text-md text-gray-500 whitespace-nowrap">{t.date}</td>
                      {/* PLATFORM */}
                      <td className="px-4 py-3.5">
                        <span className={`text-md px-2 py-0.5 rounded-md border tracking-wide ${t.platform === "BGMI" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                          {t.platform}
                        </span>
                      </td>
                      {/* MODE */}
                      <td className="px-4 py-3.5">
                        <span className="text-md px-2 py-0.5 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10">{t.mode}</span>
                      </td>
                      {/* FEES — shows all 3, highlights active */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-md font-mono">
                          <span className={t.mode === "Solo"  ? "text-[#F2AA00]" : "text-gray-600"}>₹{t.feeSolo}</span>
                          <span className="text-gray-800">/</span>
                          <span className={t.mode === "Duo"   ? "text-[#F2AA00]" : "text-gray-600"}>₹{t.feeDuo}</span>
                          <span className="text-gray-800">/</span>
                          <span className={t.mode === "Squad" ? "text-[#F2AA00]" : "text-gray-600"}>₹{t.feeSquad}</span>
                        </div>
                        <p className="text-md text-gray-700 mt-0.5 tracking-widest">solo/duo/squad</p>
                      </td>
                      {/* SLOTS */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 w-20">
                          <div className="flex justify-between text-md text-gray-600">
                            <span>{t.filled}</span><span>{t.slots}</span>
                          </div>
                          <div className="h-[3px] bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                              style={{ width: barsActive ? `${percent}%` : "0%", transitionDelay: `${i * 50}ms` }} />
                          </div>
                        </div>
                      </td>
                      {/* STATUS */}
                      <td className="px-4 py-3.5">
                        <span className={`text-md px-2.5 py-1 rounded-md border flex items-center gap-1.5 w-fit ${statusStyle[t.status]}`}>
                          <FontAwesomeIcon icon={statusIcons[t.status]} className="text-[8px]" />{t.status}
                        </span>
                      </td>
                      {/* ROOM */}
                      <td className="px-4 py-3.5">
                        {isLive ? (
                          <button onClick={() => setModal({ type: "room", tournament: t })}
                            className={`text-md px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all duration-150 ${t.roomId ? "border-[#F2AA00]/30 text-[#F2AA00] bg-[#F2AA00]/5 hover:bg-[#F2AA00]/10" : "border-gray-700 text-gray-500 hover:border-[#F2AA00]/30 hover:text-[#F2AA00]"}`}>
                            <FontAwesomeIcon icon={faKey} className="text-[8px]" />{t.roomId ? "Set ✓" : "Set"}
                          </button>
                        ) : (
                          <span className="text-md text-gray-800">—</span>
                        )}
                      </td>
                      {/* ACTIONS */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setModal({ type: "view",   tournament: t })} title="View"   className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-all duration-150">
                            <FontAwesomeIcon icon={faEye}   className="text-[10px]" />
                          </button>
                          <button onClick={() => setModal({ type: "edit",   tournament: t })} title="Edit"   className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-[#F2AA00]/50 hover:text-[#F2AA00] transition-all duration-150">
                            <FontAwesomeIcon icon={faPen}   className="text-[10px]" />
                          </button>
                          <button onClick={() => setModal({ type: "delete", tournament: t })} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-red-500/40 hover:text-red-400 transition-all duration-150">
                            <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-[10px] text-gray-700 tracking-wide">Showing {filtered.length} of {total} tournaments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
