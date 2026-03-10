"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPen,
  faTrash,
  faEye,
  faMagnifyingGlass,
  faTrophy,
  faCircleDot,
  faUsersSlash,
  faLock,
  faXmark,
  faChevronDown,
  faKey,
  faDoorOpen,
  faCoins,
  faFloppyDisk,
  faRotateLeft,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

// ── types ──────────────────────────────────────────────────
type Tournament = {
  id: number;
  name: string;
  map: string;
  mode: string;
  platform: string;
  slots: number; // total across all modes
  filled: number; // total filled across all modes
  fee: string;
  status: string;
  date: string;
  rawDate: string;
  roomId: string | null;
  roomPass: string | null;
  // per-mode fees
  feeSolo: number;
  feeDuo: number;
  feeSquad: number;
  // per-mode slots (teams)
  slotsSolo: number;
  slotsDuo: number;
  slotsSquad: number;
  // per-mode filled (teams registered)
  filledSolo: number;
  filledDuo: number;
  filledSquad: number;
  prizePool: number;
};

type FormData = {
  name: string;
  map: string;
  mode: string;
  platform: string;
  fee: string;
  feeSolo: number;
  feeDuo: number;
  feeSquad: number;
  slotsSolo: number;
  slotsDuo: number;
  slotsSquad: number;
  status: string;
  date: string;
  time: string;
  prizePool: string;
};

const FACTORY_DEFAULTS = { feeSolo: 50, feeDuo: 100, feeSquad: 150 };
const DEFAULT_FEES = FACTORY_DEFAULTS;

const statusStyle: Record<string, string> = {
  Open: "bg-green-500/10 text-green-400 border-green-500/20",
  Full: "bg-red-500/10 text-red-400 border-red-500/20",
  Closed: "bg-gray-700/40 text-gray-500 border-gray-700",
  Live: "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
};
const statusIcons: Record<string, any> = {
  Open: faCircleDot,
  Full: faUsersSlash,
  Closed: faLock,
  Live: faTrophy,
};

const MAPS = [
  "Erangel",
  "Miramar",
  "Sanhok",
  "Vikendi",
  "Rondo",
  "Warehouse",
  "Livik",
];
const MODES = ["Solo", "Duo", "Squad"];
const STATUSES = ["Open", "Full", "Closed", "Live"];

const inputCls =
  "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 text-md text-white placeholder-gray-600 outline-none transition-colors duration-200";
const selectCls =
  "w-full appearance-none bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 text-md text-white outline-none cursor-pointer transition-colors duration-200";

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

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

  // ✅ FIX: Store the time AS-IS (6 PM stays 6 PM in database)
  // Don't do any timezone conversion on save
  const iso = `${date}T${time}:00Z`;
  const d = new Date(iso);

  if (isNaN(d.getTime())) return new Date().toISOString();

  return d.toISOString();
}

function splitRawDate(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "18:00" };
  try {
    // ✅ FIX: Parse the ISO string directly without timezone conversion
    // If database has "2026-03-21T18:00:00Z", return date="2026-03-21" time="18:00"
    const dateStr = iso.split("T")[0]; // 2026-03-21
    const timeStr = iso.split("T")[1]?.slice(0, 5) || "00:00"; // 18:00

    return { date: dateStr, time: timeStr };
  } catch {
    return { date: "", time: "18:00" };
  }
}

function fmtDisplay(iso: string): string {
  if (!iso) return "—";
  try {
    // ✅ FIX: Parse and display without timezone conversion
    const d = new Date(iso.replace(" ", "T"));
    
    // Extract date/time directly from the ISO string
    const dateStr = iso.split("T")[0]; // YYYY-MM-DD
    const timeStr = iso.split("T")[1]?.slice(0, 5) || "00:00"; // HH:MM
    
    // Format: "21 Mar 2026 · 6:00 PM IST"
    const dateObj = new Date(dateStr + "T00:00:00Z");
    const dayName = dateObj.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Convert 24-hour to 12-hour format
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayTime = `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;

    return `${dayName} · ${displayTime} IST`;
  } catch {
    return iso;
  }
}

function activeFee(form: FormData): number {
  const m = form.mode.toLowerCase();
  if (m === "solo") return form.feeSolo;
  if (m === "duo") return form.feeDuo;
  return form.feeSquad;
}

// ✅ FIX: Get only the active mode's slots
function getActiveModeSlots(form: FormData): number {
  const m = form.mode.toLowerCase();
  if (m === "solo") return form.slotsSolo;
  if (m === "duo") return form.slotsDuo;
  return form.slotsSquad;
}

// ── PRIMITIVES ─────────────────────────────────────────────
function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
      <p className="text-md tracking-wide text-white">{title}</p>
      <button
        onClick={onClose}
        className="text-gray-600 hover:text-white transition-colors"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-md text-gray-600 tracking-widests uppercase mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

// ── PER-MODE FEES EDITOR ───────────────────────────────────
function FeesEditor({
  form,
  set,
}: {
  form: FormData;
  set: (k: keyof FormData, v: any) => void;
}) {
  const fees = [
    { label: "Solo", key: "feeSolo" as const, default: DEFAULT_FEES.feeSolo },
    { label: "Duo", key: "feeDuo" as const, default: DEFAULT_FEES.feeDuo },
    {
      label: "Squad",
      key: "feeSquad" as const,
      default: DEFAULT_FEES.feeSquad,
    },
  ];
  return (
    <div className="bg-black border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <FontAwesomeIcon icon={faCoins} className="text-[#F2AA00]/60 text-md" />
        <p className="text-md text-gray-600 tracking-widests uppercase">
          Entry Fees by Mode
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {fees.map(({ label, key, default: def }) => {
          const isActive = form.mode.toLowerCase() === label.toLowerCase();
          return (
            <div
              key={key}
              className={`rounded-lg border p-2.5 transition-all duration-150 ${isActive ? "border-[#F2AA00]/40 bg-[#F2AA00]/5" : "border-gray-800 bg-black"}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] tracking-widests uppercase ${isActive ? "text-[#F2AA00]" : "text-gray-600"}`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="text-[8px] text-[#F2AA00] border border-[#F2AA00]/30 px-1 py-0.5 rounded tracking-widests">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-md">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={form[key]}
                  onChange={(e) => set(key, Number(e.target.value))}
                  className={`w-full bg-transparent border rounded px-5 py-1.5 text-md font-mono outline-none transition-colors ${isActive ? "border-[#F2AA00]/30 text-[#F2AA00] focus:border-[#F2AA00]" : "border-gray-800 text-gray-400 focus:border-gray-600"}`}
                />
              </div>
              <button
                onClick={() => set(key, def)}
                className="text-md text-gray-700 hover:text-gray-500 mt-1 tracking-widests transition-colors"
              >
                reset to ₹{def}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-gray-800">
        <span className="text-[10px] text-gray-600 tracking-widests uppercase">
          Current tournament fee
        </span>
        <span className="text-[#F2AA00] font-mono text-md">
          ₹{activeFee(form)}{" "}
          <span className="text-gray-600 text-[10px] capitalize">
            ({form.mode})
          </span>
        </span>
      </div>
    </div>
  );
}

// ── VIEW MODAL ─────────────────────────────────────────────
function ViewModal({
  t,
  onClose,
  onEdit,
  onRoomEdit,
}: {
  t: Tournament;
  onClose: () => void;
  onEdit: () => void;
  onRoomEdit: () => void;
}) {
  const isLive = t.status === "Live";
  const totalSlots = t.slotsSolo + t.slotsDuo + t.slotsSquad;
  // ✅ FIX #5: Guard against undefined filled values
  const totalFilled =
    (t.filledSolo ?? 0) + (t.filledDuo ?? 0) + (t.filledSquad ?? 0);
  const percent =
    totalSlots > 0 ? Math.round((totalFilled / totalSlots) * 100) : 0;

  // ✅ FIX #3: Ensure filled values have defaults
  const modeSlots = [
    {
      label: "Solo",
      slots: t.slotsSolo,
      filled: t.filledSolo ?? 0,
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
    },
    {
      label: "Duo",
      slots: t.slotsDuo,
      filled: t.filledDuo ?? 0,
      color: "text-purple-400",
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
    },
    {
      label: "Squad",
      slots: t.slotsSquad,
      filled: t.filledSquad ?? 0,
      color: "text-[#F2AA00]",
      border: "border-[#F2AA00]/20",
      bg: "bg-[#F2AA00]/5",
    },
  ];

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Tournament Details" onClose={onClose} />
      <div className="p-6 space-y-4 overflow-y-auto max-h-[85vh]">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <div className="w-10 h-10 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-md text-white tracking-wide truncate">
              {t.name}
            </p>
            <p className="text-md text-gray-600 mt-0.5">
              {t.map} · {t.mode} · {t.platform}
            </p>
          </div>
          <span
            className={`text-md px-2.5 py-1 rounded-md border flex items-center gap-1.5 flex-shrink-0 ${statusStyle[t.status]}`}
          >
            <FontAwesomeIcon
              icon={statusIcons[t.status]}
              className="text-[8px]"
            />
            {t.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Start Date & Time", val: t.date },
            { label: "Entry Fee", val: t.fee },
            { label: "Platform", val: t.platform },
            { label: "Mode", val: t.mode },
          ].map((r, i) => (
            <div
              key={i}
              className="bg-black border border-gray-800 rounded-lg px-3 py-2.5"
            >
              <p className="text-[10px] text-gray-600 tracking-widests uppercase mb-1">
                {r.label}
              </p>
              <p className="text-md text-white">{r.val}</p>
            </div>
          ))}
        </div>

        {/* Per-mode fees */}
        <div className="bg-black border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-600 tracking-widests uppercase mb-2.5">
            Entry Fees by Mode
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Solo", val: t.feeSolo },
              { label: "Duo", val: t.feeDuo },
              { label: "Squad", val: t.feeSquad },
            ].map(({ label, val }) => {
              const isActive = t.mode.toLowerCase() === label.toLowerCase();
              return (
                <div
                  key={label}
                  className={`rounded-lg border px-2.5 py-2 text-center ${isActive ? "border-[#F2AA00]/30 bg-[#F2AA00]/5" : "border-gray-800"}`}
                >
                  <p
                    className={`text-md tracking-widests uppercase mb-1 ${isActive ? "text-[#F2AA00]" : "text-gray-600"}`}
                  >
                    {label}
                  </p>
                  <p
                    className={`font-mono text-md ${isActive ? "text-[#F2AA00]" : "text-gray-500"}`}
                  >
                    ₹{val}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-mode slots breakdown */}
        <div className="bg-black border border-gray-800 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-gray-600 tracking-widests uppercase">
              Slots by Mode (Teams)
            </p>
            <span className="text-[10px] font-mono text-gray-500">
              {totalFilled}/{totalSlots} total · {percent}%
            </span>
          </div>
          <div className="space-y-2">
            {modeSlots.map(({ label, slots, filled, color, border, bg }) => {
              if (slots === 0) return null;
              const pct = slots > 0 ? Math.round((filled / slots) * 100) : 0;
              const isActive = t.mode.toLowerCase() === label.toLowerCase();
              return (
                <div
                  key={label}
                  className={`rounded-lg border px-3 py-2 ${isActive ? `${border} ${bg}` : "border-gray-800/60"}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] tracking-widests uppercase ${isActive ? color : "text-gray-600"}`}
                    >
                      {label}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${isActive ? color : "text-gray-500"}`}
                    >
                      {filled}/{slots} teams · {pct}%
                    </span>
                  </div>
                  <div className="h-[3px] bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? "bg-red-500" : isActive ? "bg-current" : "bg-gray-600"}`}
                      style={{
                        width: `${pct}%`,
                        color: isActive ? undefined : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Total bar */}
          <div className="mt-3 pt-2 border-t border-gray-800">
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {isLive && (
          <div
            className={`rounded-xl border px-4 py-3.5 space-y-2.5 ${t.roomId ? "border-[#F2AA00]/30 bg-[#F2AA00]/5" : "border-gray-800 bg-black"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-gray-500 tracking-widests uppercase">
                Room Info
              </p>
              {!t.roomId && (
                <span className="text-[10px] text-[#F2AA00] border border-[#F2AA00]/30 bg-[#F2AA00]/10 px-2 py-0.5 rounded-full">
                  Not set
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-[10px] text-gray-600 tracking-widests uppercase mb-1">
                  Room ID
                </p>
                <p
                  className={`text-md font-mono ${t.roomId ? "text-[#F2AA00]" : "text-gray-700"}`}
                >
                  {t.roomId || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-600 tracking-widests uppercase mb-1">
                  Password
                </p>
                <p
                  className={`text-md font-mono ${t.roomPass ? "text-[#F2AA00]" : "text-gray-700"}`}
                >
                  {t.roomPass || "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-md tracking-widests rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150"
          >
            Close
          </button>
          {isLive && (
            <button
              onClick={onRoomEdit}
              className="flex-1 border border-[#F2AA00]/40 text-[#F2AA00] py-2.5 text-md tracking-widests rounded-lg hover:bg-[#F2AA00]/10 transition-all duration-150"
            >
              <FontAwesomeIcon icon={faKey} className="mr-1.5" />
              {t.roomId ? "Update Room" : "Set Room"}
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex-1 border border-gray-700 text-gray-300 py-2.5 text-md tracking-widests rounded-lg hover:border-[#F2AA00]/40 hover:text-[#F2AA00] transition-all duration-150"
          >
            <FontAwesomeIcon icon={faPen} className="mr-1.5" />
            Edit
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── ROOM MODAL ─────────────────────────────────────────────
function RoomModal({
  t,
  onSave,
  onClose,
}: {
  t: Tournament;
  onSave: (id: string, pass: string) => void;
  onClose: () => void;
}) {
  const [roomId, setRoomId] = useState(t.roomId ?? "");
  const [roomPass, setRoomPass] = useState(t.roomPass ?? "");
  const valid = roomId.trim() !== "";
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Set Room ID & Password" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 bg-[#F2AA00]/5 border border-[#F2AA00]/20 rounded-xl px-4 py-3">
          <FontAwesomeIcon
            icon={faDoorOpen}
            className="text-[#F2AA00] flex-shrink-0"
          />
          <div>
            <p className="text-md text-white">{t.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Players will see this room info to join
            </p>
          </div>
        </div>
        <Field label="Room ID">
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="e.g. 7482910"
            className={inputCls + " font-mono tracking-widests"}
          />
        </Field>
        <Field label="Room Password">
          <input
            value={roomPass}
            onChange={(e) => setRoomPass(e.target.value)}
            placeholder="e.g. squad123"
            className={inputCls + " font-mono tracking-widests"}
          />
          <p className="text-[10px] text-gray-700 mt-1.5">
            Leave blank for no password
          </p>
        </Field>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-md tracking-widests rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onSave(roomId.trim(), roomPass.trim())}
            className={`flex-1 py-2.5 text-md tracking-widests rounded-lg border transition-all duration-150 active:scale-[0.97] ${valid ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00]" : "bg-gray-800/40 text-gray-600 border-gray-800 cursor-not-allowed"}`}
          >
            Save Room Info
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── CREATE / EDIT MODAL ────────────────────────────────────
function TournamentFormModal({
  initial,
  title,
  onSave,
  onClose,
}: {
  initial: FormData;
  title: string;
  onSave: (d: FormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const set = (k: keyof FormData, v: any) => setForm((p) => ({ ...p, [k]: v }));
  
  // ✅ FIX: Only count the active mode's slots
  const activeModeSlots = getActiveModeSlots(form);
  const valid =
    form.name.trim() !== "" && form.date.trim() !== "" && activeModeSlots > 0;

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
        <Field label="Tournament Name">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Erangel Squad Battle"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Map">
            <select
              value={form.map}
              onChange={(e) => set("map", e.target.value)}
              className={selectCls}
            >
              {MAPS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Mode">
            <select
              value={form.mode}
              onChange={(e) => set("mode", e.target.value)}
              className={selectCls}
            >
              {MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Platform">
            <select
              value={form.platform}
              onChange={(e) => set("platform", e.target.value)}
              className={selectCls}
            >
              {["BGMI", "PUBG"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={selectCls}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* ── PER-MODE FEES ─────────────────────── */}
        <FeesEditor form={form} set={set} />

        {/* ── PER-MODE SLOTS ────────────────────── */}
        <div className="bg-black border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-md text-gray-600 tracking-widests uppercase">
              Slots for {form.mode}
            </p>
            <span className="text-[10px] font-mono text-gray-600 border border-gray-800 px-2 py-0.5 rounded">
              Total: <span className="text-white">{activeModeSlots}</span> teams
            </span>
          </div>

          {/* ✅ FIX: Only show the selected mode's slot input */}
          {form.mode === "Solo" && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-widests uppercase text-blue-400 font-semibold">
                  Solo Teams Slots
                </span>
                <span className="text-[8px] border border-blue-500/30 px-2 py-1 rounded tracking-widests text-blue-400 bg-blue-500/10 font-semibold">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={form.slotsSolo}
                  onChange={(e) => set("slotsSolo", Number(e.target.value))}
                  className="flex-1 bg-transparent border border-blue-500/40 rounded-lg px-4 py-3 text-xl font-mono outline-none text-blue-400 focus:border-blue-400 transition-colors"
                />
                <span className="text-sm text-gray-600 font-mono">teams</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2.5">
                1 slot = 1 player (Solo mode)
              </p>
            </div>
          )}

          {form.mode === "Duo" && (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-widests uppercase text-purple-400 font-semibold">
                  Duo Teams Slots
                </span>
                <span className="text-[8px] border border-purple-500/30 px-2 py-1 rounded tracking-widests text-purple-400 bg-purple-500/10 font-semibold">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={form.slotsDuo}
                  onChange={(e) => set("slotsDuo", Number(e.target.value))}
                  className="flex-1 bg-transparent border border-purple-500/40 rounded-lg px-4 py-3 text-xl font-mono outline-none text-purple-400 focus:border-purple-400 transition-colors"
                />
                <span className="text-sm text-gray-600 font-mono">teams</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2.5">
                1 slot = 2 players (Duo mode)
              </p>
            </div>
          )}

          {form.mode === "Squad" && (
            <div className="rounded-lg border border-[#F2AA00]/20 bg-[#F2AA00]/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-widests uppercase text-[#F2AA00] font-semibold">
                  Squad Teams Slots
                </span>
                <span className="text-[8px] border border-[#F2AA00]/30 px-2 py-1 rounded tracking-widests text-[#F2AA00] bg-[#F2AA00]/10 font-semibold">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={form.slotsSquad}
                  onChange={(e) => set("slotsSquad", Math.min(25, Number(e.target.value)))}
                  className="flex-1 bg-transparent border border-[#F2AA00]/40 rounded-lg px-4 py-3 text-xl font-mono outline-none text-[#F2AA00] focus:border-[#F2AA00] transition-colors"
                />
                <span className="text-sm text-gray-600 font-mono">teams (max 25)</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2.5">
                1 slot = 4 players (Squad mode)
              </p>
            </div>
          )}

          {activeModeSlots === 0 && (
            <p className="text-[10px] text-red-400/70">
              Please enter a number of slots
            </p>
          )}

          <div className="pt-2 border-t border-gray-800">
            <p className="text-[10px] text-gray-600">
              You can always update other modes later in the Edit Tournament
              modal if needed
            </p>
          </div>
        </div>

        {/* ── DATE + TIME ─────────────────────────── */}
        <div className="bg-black border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-md text-gray-600 tracking-widests uppercase">
            Start Date & Time (IST)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-700 tracking-widests uppercase mb-1.5">
                Date
              </p>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={inputCls + " [color-scheme:dark]"}
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-700 tracking-widests uppercase mb-1.5">
                Time
              </p>
              <input
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className={inputCls + " [color-scheme:dark]"}
              />
            </div>
          </div>
          {form.date && (
            <p className="text-[10px] text-[#F2AA00]/60">
              {"IST " +
                new Date(`${form.date}T${form.time}:00`).toLocaleString(
                  "en-IN",
                  {
                    timeZone: "Asia/Kolkata",
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  },
                )}
            </p>
          )}
        </div>

        <Field label="Prize Pool (₹)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-md">
              ₹
            </span>
            <input
              value={form.prizePool}
              onChange={(e) => set("prizePool", e.target.value)}
              placeholder="0"
              className={inputCls + " pl-7"}
            />
          </div>
        </Field>

        {form.status === "Live" && (
          <div className="flex items-start gap-2.5 bg-[#F2AA00]/5 border border-[#F2AA00]/20 rounded-xl px-4 py-3">
            <FontAwesomeIcon
              icon={faKey}
              className="text-[#F2AA00] flex-shrink-0 mt-0.5"
            />
            <p className="text-md text-gray-400 leading-relaxed">
              Tournament is <span className="text-[#F2AA00]">Live</span>. After
              saving, set Room ID & Password from the View modal.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-md tracking-widests rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onSave(form)}
            className={`flex-1 py-2.5 text-md tracking-widests rounded-lg border transition-all duration-150 active:scale-[0.97] ${valid ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20" : "bg-gray-800/40 text-gray-600 border-gray-800 cursor-not-allowed"}`}
          >
            {title === "Create Tournament" ? "Create" : "Save Changes"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── DELETE MODAL ───────────────────────────────────────────
function DeleteModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Overlay onClose={onCancel}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <p className="text-md tracking-wide text-white">Delete Tournament?</p>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <p className="text-md text-gray-500 leading-relaxed">
          You're about to delete <span className="text-white">"{name}"</span>.
          This action cannot be undone.
        </p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-800 text-gray-400 py-2 text-md tracking-widests rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-2 text-md tracking-widests rounded-lg hover:bg-red-500/20 active:scale-[0.97] transition-all duration-150"
          >
            Delete
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── DEFAULT FEES CARD ──────────────────────────────────────
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
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DefaultFees>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(defaults);
  }, [defaults]);

  const isDirty =
    draft.feeSolo !== defaults.feeSolo ||
    draft.feeDuo !== defaults.feeDuo ||
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
    {
      key: "feeSolo" as const,
      label: "Solo",
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
    },
    {
      key: "feeDuo" as const,
      label: "Duo",
      color: "text-purple-400",
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
    },
    {
      key: "feeSquad" as const,
      label: "Squad",
      color: "text-[#F2AA00]",
      border: "border-[#F2AA00]/20",
      bg: "bg-[#F2AA00]/5",
    },
  ];

  return (
    <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-colors duration-200 hover:border-gray-700">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon
              icon={faCoins}
              className="text-[#F2AA00] text-[10px]"
            />
          </div>
          <div>
            <p className="text-md text-white tracking-wide">
              Default Entry Fees
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5 tracking-wide">
              Auto-filled when creating new tournaments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            {modes.map(({ key, label, color }) => (
              <span key={key} className="text-[10px] font-mono tracking-wide">
                <span className="text-gray-600">{label} </span>
                {/* ✅ FIX #7: Guard defaults display */}
                <span className={color}>
                  ₹{defaults[key] ?? FACTORY_DEFAULTS[key]}
                </span>
              </span>
            ))}
          </div>
          <FontAwesomeIcon
            icon={open ? faChevronUp : faChevronDown}
            className="text-gray-600 text-[10px] transition-transform duration-200"
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-800 px-5 py-4 space-y-4">
          <p className="text-md text-gray-500 leading-relaxed">
            These values pre-fill the fees when you create a new tournament.
            Each tournament can still be customised individually after creation.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {modes.map(({ key, label, color, border, bg }) => (
              <div
                key={key}
                className={`rounded-xl border ${border} ${bg} p-3`}
              >
                <p
                  className={`text-[10px] tracking-widests uppercase mb-2 ${color}`}
                >
                  {label}
                </p>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-md">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        [key]: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className={`w-full bg-black/60 border rounded-lg pl-6 pr-2 py-2 text-md font-mono outline-none transition-colors ${draft[key] !== defaults[key] ? `${border} ${color}` : "border-gray-800 text-white"} focus:border-[#F2AA00]/40`}
                  />
                </div>
                {draft[key] !== FACTORY_DEFAULTS[key] && (
                  <button
                    onClick={() =>
                      setDraft((d) => ({ ...d, [key]: FACTORY_DEFAULTS[key] }))
                    }
                    className="text-md text-gray-700 hover:text-gray-500 mt-1.5 tracking-widests transition-colors"
                  >
                    reset to ₹{FACTORY_DEFAULTS[key]}
                  </button>
                )}
              </div>
            ))}
          </div>
          {isDirty && (
            <div className="flex flex-wrap gap-2 text-[10px]">
              {modes.map(({ key, label, color }) =>
                draft[key] !== defaults[key] ? (
                  <span
                    key={key}
                    className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-full px-2.5 py-1"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-700 line-through font-mono">
                      ₹{defaults[key]}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className={`font-mono ${color}`}>₹{draft[key]}</span>
                  </span>
                ) : null,
              )}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              disabled={
                draft.feeSolo === FACTORY_DEFAULTS.feeSolo &&
                draft.feeDuo === FACTORY_DEFAULTS.feeDuo &&
                draft.feeSquad === FACTORY_DEFAULTS.feeSquad
              }
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-widests rounded-lg border border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="text-md" />
              Reset all
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-widests rounded-lg border transition-all duration-150 active:scale-[0.97] ${saved ? "bg-green-500/10 border-green-500/30 text-green-400" : isDirty ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00]" : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"}`}
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
  | { type: "view"; tournament: Tournament }
  | { type: "edit"; tournament: Tournament }
  | { type: "delete"; tournament: Tournament }
  | { type: "room"; tournament: Tournament }
  | { type: "create" }
  | null;

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [modal, setModal] = useState<ModalState>(null);
  const [visible, setVisible] = useState(false);
  const [barsActive, setBarsActive] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [defaultFees, setDefaultFees] = useState<DefaultFees>(FACTORY_DEFAULTS);

  useEffect(() => {
    setDefaultFees(loadDefaultFees());
  }, []);
  useEffect(() => {
    fetchTournaments();
  }, []);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(() => setBarsActive(true), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  // ✅ FIX #2: Ensure all API fields have defaults
  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/admin/tournaments", { cache: "no-store" });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      const formatted: Tournament[] = data.map((t: any) => {
        const raw = t.start_date ?? "";
        const mode = capitalize(t.mode);
        const feeSolo = t.fee_solo ?? DEFAULT_FEES.feeSolo;
        const feeDuo = t.fee_duo ?? DEFAULT_FEES.feeDuo;
        const feeSquad = t.fee_squad ?? DEFAULT_FEES.feeSquad;
        const activeEntryFee =
          t.mode === "solo" ? feeSolo : t.mode === "duo" ? feeDuo : feeSquad;

        return {
          id: t.id,
          name: t.title,
          map: t.map,
          mode,
          platform: t.game === "PUBG" ? "PUBG" : "BGMI",
          slots: t.total_slots ?? 0,
          filled: t.filled_slots ?? t._count?.registrations ?? 0,
          fee: activeEntryFee === 0 ? "Free" : `₹${activeEntryFee}`,
          status: capitalize(t.status),
          date: fmtDisplay(raw),
          rawDate: raw,
          roomId: t.room_id ?? null,
          roomPass: t.room_pass ?? null,
          feeSolo,
          feeDuo,
          feeSquad,
          slotsSolo: t.slots_solo ?? 0,
          slotsDuo: t.slots_duo ?? 0,
          slotsSquad: t.slots_squad ?? 0,
          // ✅ FIX: Add explicit defaults for filled_* fields
          filledSolo: t.filled_solo ?? 0,
          filledDuo: t.filled_duo ?? 0,
          filledSquad: t.filled_squad ?? 0,
          prizePool: Number(t.prize_pool) || 0,
        };
      });
      setTournaments(formatted);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleDefaultFeesSave = (d: DefaultFees) => {
    localStorage.setItem(LS_KEY, JSON.stringify(d));
    setDefaultFees(d);
    showToast("Default fees updated ✓");
  };

  const buildEmptyForm = (): FormData => ({
    name: "",
    map: "Erangel",
    mode: "Squad",
    platform: "BGMI",
    slotsSolo: 100,
    slotsDuo: 50,
    slotsSquad: 25,
    fee: String(defaultFees.feeSquad),
    feeSolo: defaultFees.feeSolo,
    feeDuo: defaultFees.feeDuo,
    feeSquad: defaultFees.feeSquad,
    status: "Open",
    date: "",
    time: "18:00",
    prizePool: "0",
  });

  // ✅ FIX #1: buildPayload explicitly sends filled_* as 0
  const buildPayload = (data: FormData) => {
    // ✅ FIX: Only set slots for the selected mode, zero out others
    let slotsSolo = 0;
    let slotsDuo = 0;
    let slotsSquad = 0;

    if (data.mode === "Solo") {
      slotsSolo = data.slotsSolo;
    } else if (data.mode === "Duo") {
      slotsDuo = data.slotsDuo;
    } else if (data.mode === "Squad") {
      slotsSquad = data.slotsSquad;
    }

    return {
      title: data.name,
      game: data.platform === "PUBG" ? "PUBG" : "BGMI",
      mode: data.mode.toLowerCase(),
      map: data.map,
      entry_fee: activeFee(data),
      fee_solo: data.feeSolo,
      fee_duo: data.feeDuo,
      fee_squad: data.feeSquad,
      prize_pool: Number(data.prizePool) || 0,
      // ✅ FIX: Only set slots for the selected mode
      slots_solo: slotsSolo,
      slots_duo: slotsDuo,
      slots_squad: slotsSquad,
      // ✅ FIX: Explicitly initialize filled counters
      filled_solo: 0,
      filled_duo: 0,
      filled_squad: 0,
      start_date: toISO(data.date, data.time),
      status: data.status.toLowerCase(),
    };
  };

  const handleCreate = async (data: FormData) => {
    try {
      await authFetch("/api/admin/tournaments", {
        method: "POST",
        body: JSON.stringify(buildPayload(data)),
      });
      await fetchTournaments();
      setModal(null);
      showToast("Tournament created ✓");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (data: FormData) => {
    if (modal?.type !== "edit") return;
    try {
      await authFetch(`/api/admin/tournaments/${modal.tournament.id}`, {
        method: "PUT",
        body: JSON.stringify(buildPayload(data)),
      });
      await fetchTournaments();
      setModal(null);
      showToast("Tournament updated ✓");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await authFetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
      await fetchTournaments();
      setModal(null);
      showToast("Tournament deleted");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomSave = async (roomId: string, roomPass: string) => {
    if (modal?.type !== "room") return;
    try {
      await authFetch(`/api/admin/tournaments/${modal.tournament.id}`, {
        method: "PUT",
        body: JSON.stringify({ room_id: roomId, room_pass: roomPass }),
      });
      await fetchTournaments();
      setModal(null);
      showToast("Room info saved ✓");
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = tournaments.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.name.toLowerCase().includes(q) || t.map.toLowerCase().includes(q)) &&
      (statusFilter === "All" || t.status === statusFilter) &&
      (modeFilter === "All" || t.mode === modeFilter)
    );
  });

  const total = tournaments.length;
  const open = tournaments.filter((t) => t.status === "Open").length;
  const live = tournaments.filter((t) => t.status === "Live").length;
  const full = tournaments.filter((t) => t.status === "Full").length;
  const closed = tournaments.filter((t) => t.status === "Closed").length;

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">
      {/* TOAST */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-md px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widests transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}
      >
        {toast.msg}
      </div>

      {/* MODALS */}
      {modal?.type === "view" && (
        <ViewModal
          t={modal.tournament}
          onClose={() => setModal(null)}
          onEdit={() =>
            setModal({ type: "edit", tournament: modal.tournament })
          }
          onRoomEdit={() =>
            setModal({ type: "room", tournament: modal.tournament })
          }
        />
      )}
      {modal?.type === "room" && (
        <RoomModal
          t={modal.tournament}
          onSave={handleRoomSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "create" && (
        <TournamentFormModal
          title="Create Tournament"
          initial={buildEmptyForm()}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" &&
        (() => {
          const { date, time } = splitRawDate(modal.tournament.rawDate);
          return (
            <TournamentFormModal
              title="Edit Tournament"
              initial={{
                name: modal.tournament.name ?? "",
                map: modal.tournament.map ?? "Erangel",
                mode: modal.tournament.mode ?? "Squad",
                platform: modal.tournament.platform ?? "BGMI",
                slotsSolo: modal.tournament.slotsSolo ?? 0,
                slotsDuo: modal.tournament.slotsDuo ?? 0,
                slotsSquad: modal.tournament.slotsSquad ?? 0,
                fee: String(modal.tournament.feeSolo ?? 0),
                feeSolo: modal.tournament.feeSolo ?? DEFAULT_FEES.feeSolo,
                feeDuo: modal.tournament.feeDuo ?? DEFAULT_FEES.feeDuo,
                feeSquad: modal.tournament.feeSquad ?? DEFAULT_FEES.feeSquad,
                status: modal.tournament.status ?? "Open",
                prizePool: String(modal.tournament.prizePool ?? 0),
                date,
                time,
              }}
              onSave={handleEdit}
              onClose={() => setModal(null)}
            />
          );
        })()}
      {modal?.type === "delete" && (
        <DeleteModal
          name={modal.tournament.name}
          onConfirm={() => handleDelete(modal.tournament.id)}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        {/* HEADER */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}
        >
          <div>
            <h1 className="text-xl tracking-widests text-white">
              Manage Tournaments
            </h1>
            <p className="text-gray-600 text-md mt-1 tracking-wide">
              {total} tournaments total
            </p>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="self-start sm:self-auto bg-[#F2AA00] text-black px-5 py-2.5 text-md tracking-widests rounded-lg hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-[0.97] transition-all duration-150 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} className="text-md" />
            Create Tournament
          </button>
        </div>

        {/* DEFAULT FEES CARD */}
        <div
          className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "60ms" }}
        >
          <DefaultFeesCard
            defaults={defaultFees}
            onSave={handleDefaultFeesSave}
          />
        </div>

        {/* SUMMARY */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-5 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "80ms" }}
        >
          {[
            { label: "Total", value: total, color: "text-white" },
            { label: "Open", value: open, color: "text-green-400" },
            { label: "Live", value: live, color: "text-[#F2AA00]" },
            { label: "Full", value: full, color: "text-red-400" },
            { label: "Closed", value: closed, color: "text-gray-500" },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors duration-200"
            >
              <p className="text-gray-600 text-md tracking-widests uppercase">
                {s.label}
              </p>
              <p className={`text-xl mt-1 font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div
          className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "160ms" }}
        >
          <div className="relative flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-md"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or map..."
              className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-md text-white placeholder-gray-600 outline-none transition-colors duration-200"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-md text-gray-400 outline-none cursor-pointer"
            >
              {["All", "Open", "Live", "Full", "Closed"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-md pointer-events-none"
            />
          </div>
          <div className="relative">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-md text-gray-400 outline-none cursor-pointer"
            >
              {["All", "Solo", "Duo", "Squad"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-md pointer-events-none"
            />
          </div>
        </div>

        {/* TABLE */}
        <div
          className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "240ms" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {[
                    "Tournament",
                    "Start",
                    "Platform",
                    "Mode",
                    "Fees (S/D/Q)",
                    "Slots (S/D/Q)",
                    "Status",
                    "Room",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-md text-gray-600 tracking-widests px-4 py-3 text-left font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-14 text-gray-700 text-md tracking-widests"
                    >
                      No tournaments match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => {
                    const totalSlots = t.slotsSolo + t.slotsDuo + t.slotsSquad;
                    const totalFilled =
                      (t.filledSolo ?? 0) +
                      (t.filledDuo ?? 0) +
                      (t.filledSquad ?? 0);
                    const percent =
                      totalSlots > 0
                        ? Math.round((totalFilled / totalSlots) * 100)
                        : 0;
                    const isLive = t.status === "Live";

                    // active mode slot info
                    const modeSlots =
                      t.mode === "Solo"
                        ? t.slotsSolo
                        : t.mode === "Duo"
                          ? t.slotsDuo
                          : t.slotsSquad;
                    const modeFilled =
                      t.mode === "Solo"
                        ? t.filledSolo
                        : t.mode === "Duo"
                          ? t.filledDuo
                          : t.filledSquad;

                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                        style={{ transitionDelay: `${320 + i * 50}ms` }}
                      >
                        {/* NAME */}
                        <td className="px-4 py-3.5">
                          <p className="text-md text-white group-hover:text-[#F2AA00] transition-colors duration-200">
                            {t.name}
                          </p>
                          <p className="text-md text-gray-600 mt-0.5">
                            {t.map}
                          </p>
                        </td>
                        {/* DATE */}
                        <td className="px-4 py-3.5 text-md text-gray-500 whitespace-nowrap">
                          {t.date}
                        </td>
                        {/* PLATFORM */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-md px-2 py-0.5 rounded-md border tracking-wide ${t.platform === "BGMI" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}
                          >
                            {t.platform}
                          </span>
                        </td>
                        {/* MODE */}
                        <td className="px-4 py-3.5">
                          <span className="text-md px-2 py-0.5 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10">
                            {t.mode}
                          </span>
                        </td>
                        {/* FEES */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-md font-mono">
                            <span
                              className={
                                t.mode === "Solo"
                                  ? "text-[#F2AA00]"
                                  : "text-gray-600"
                              }
                            >
                              ₹{t.feeSolo}
                            </span>
                            <span className="text-gray-800">/</span>
                            <span
                              className={
                                t.mode === "Duo"
                                  ? "text-[#F2AA00]"
                                  : "text-gray-600"
                              }
                            >
                              ₹{t.feeDuo}
                            </span>
                            <span className="text-gray-800">/</span>
                            <span
                              className={
                                t.mode === "Squad"
                                  ? "text-[#F2AA00]"
                                  : "text-gray-600"
                              }
                            >
                              ₹{t.feeSquad}
                            </span>
                          </div>
                          <p className="text-md text-gray-700 mt-0.5 tracking-widests">
                            solo/duo/squad
                          </p>
                        </td>

                        {/* SLOTS — per-mode breakdown with IMPROVED SIZING */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1.5 w-56">
                            {/* Solo */}
                            {t.slotsSolo > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-400/70 w-8 tracking-widests">
                                  S
                                </span>
                                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${(t.filledSolo ?? 0) >= t.slotsSolo ? "bg-red-500" : "bg-blue-400"}`}
                                    style={{
                                      width: barsActive
                                        ? `${Math.round(((t.filledSolo ?? 0) / t.slotsSolo) * 100)}%`
                                        : "0%",
                                      transitionDelay: `${i * 50}ms`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 font-mono  w-16 text-right">
                                  {t.filledSolo ?? 0}/{t.slotsSolo}
                                </span>
                              </div>
                            )}
                            {/* Duo */}
                            {t.slotsDuo > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-purple-400/70 w-8 tracking-widests ">
                                  D
                                </span>
                                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${(t.filledDuo ?? 0) >= t.slotsDuo ? "bg-red-500" : "bg-purple-400"}`}
                                    style={{
                                      width: barsActive
                                        ? `${Math.round(((t.filledDuo ?? 0) / t.slotsDuo) * 100)}%`
                                        : "0%",
                                      transitionDelay: `${i * 50 + 50}ms`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 font-mono  w-16 text-right">
                                  {t.filledDuo ?? 0}/{t.slotsDuo}
                                </span>
                              </div>
                            )}
                            {/* Squad */}
                            {t.slotsSquad > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#F2AA00]/70 w-8 tracking-widests ">
                                  SQ
                                </span>
                                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${(t.filledSquad ?? 0) >= t.slotsSquad ? "bg-red-500" : "bg-[#F2AA00]"}`}
                                    style={{
                                      width: barsActive
                                        ? `${Math.round(((t.filledSquad ?? 0) / t.slotsSquad) * 100)}%`
                                        : "0%",
                                      transitionDelay: `${i * 50 + 100}ms`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 font-mono  w-16 text-right">
                                  {t.filledSquad ?? 0}/{t.slotsSquad}
                                </span>
                              </div>
                            )}
                            {/* Total */}
                            <div className="flex justify-between items-center text-xs text-gray-600 pt-1 border-t border-gray-800/60 mt-1.5">
                              <span className="">TOTAL</span>
                              <span className="font-mono ">
                                {(t.filledSolo ?? 0) +
                                  (t.filledDuo ?? 0) +
                                  (t.filledSquad ?? 0)}
                                /{t.slotsSolo + t.slotsDuo + t.slotsSquad}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-md px-2.5 py-1 rounded-md border flex items-center gap-1.5 w-fit ${statusStyle[t.status]}`}
                          >
                            <FontAwesomeIcon
                              icon={statusIcons[t.status]}
                              className="text-[8px]"
                            />
                            {t.status}
                          </span>
                        </td>
                        {/* ROOM */}
                        <td className="px-4 py-3.5">
                          {isLive ? (
                            <button
                              onClick={() =>
                                setModal({ type: "room", tournament: t })
                              }
                              className={`text-md px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all duration-150 ${t.roomId ? "border-[#F2AA00]/30 text-[#F2AA00] bg-[#F2AA00]/5 hover:bg-[#F2AA00]/10" : "border-gray-700 text-gray-500 hover:border-[#F2AA00]/30 hover:text-[#F2AA00]"}`}
                            >
                              <FontAwesomeIcon
                                icon={faKey}
                                className="text-[8px]"
                              />
                              {t.roomId ? "Set ✓" : "Set"}
                            </button>
                          ) : (
                            <span className="text-md text-gray-800">—</span>
                          )}
                        </td>
                        {/* ACTIONS */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                setModal({ type: "view", tournament: t })
                              }
                              title="View"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-all duration-150"
                            >
                              <FontAwesomeIcon
                                icon={faEye}
                                className="text-[10px]"
                              />
                            </button>
                            <button
                              onClick={() =>
                                setModal({ type: "edit", tournament: t })
                              }
                              title="Edit"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-[#F2AA00]/50 hover:text-[#F2AA00] transition-all duration-150"
                            >
                              <FontAwesomeIcon
                                icon={faPen}
                                className="text-[10px]"
                              />
                            </button>
                            <button
                              onClick={() =>
                                setModal({ type: "delete", tournament: t })
                              }
                              title="Delete"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-red-500/40 hover:text-red-400 transition-all duration-150"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="text-[10px]"
                              />
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
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-[10px] text-gray-700 tracking-wide">
              Showing {filtered.length} of {total} tournaments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}