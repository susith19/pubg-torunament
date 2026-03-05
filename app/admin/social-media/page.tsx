"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faYoutube, faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import {
  faPlus, faTrash, faPencil, faXmark, faToggleOn, faToggleOff,
  faLink, faSpinner, faCircleDot, faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";
import { getAuth } from "firebase/auth";

type SocialLink = {
  id:        number;
  platform:  "youtube" | "instagram";
  label:     string;
  url:       string;
  is_live:   boolean;
  is_active: boolean;
};

const PLATFORM_META = {
  youtube: {
    icon:       faYoutube,
    color:      "text-red-500",
    border:     "border-red-500/20",
    bg:         "bg-red-500/5",
    activeBg:   "bg-red-500/10",
    label:      "YouTube",
  },
  instagram: {
    icon:       faInstagram,
    color:      "text-pink-500",
    border:     "border-pink-500/20",
    bg:         "bg-pink-500/5",
    activeBg:   "bg-pink-500/10",
    label:      "Instagram",
  },
};

const inputCls = "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors duration-200";

async function getToken() {
  const auth = getAuth();
  return await auth.currentUser?.getIdToken(true) ?? localStorage.getItem("token") ?? "";
}

async function authFetch(url: string, opts: RequestInit = {}) {
  const token = await getToken();
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
  });
}

// ── FORM MODAL ────────────────────────────────────────────
function LinkModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<SocialLink>;
  onSave:  (data: Omit<SocialLink, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [platform,  setPlatform]  = useState<"youtube" | "instagram">(initial?.platform ?? "youtube");
  const [label,     setLabel]     = useState(initial?.label     ?? "");
  const [url,       setUrl]       = useState(initial?.url       ?? "");
  const [isLive,    setIsLive]    = useState(initial?.is_live   ?? false);
  const [isActive,  setIsActive]  = useState(initial?.is_active ?? true);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState("");

  const isEdit = !!initial?.id;
  const valid  = url.trim() !== "";

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setErr("");
    try {
      await onSave({ platform, label: label || PLATFORM_META[platform].label, url: url.trim(), is_live: isLive, is_active: isActive });
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
      setSaving(false);
    }
  };

  const meta = PLATFORM_META[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <p className="text-sm text-white tracking-wide">{isEdit ? "Edit Link" : "Add Social Link"}</p>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {err && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</p>}

          {/* Platform select */}
          <div>
            <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-2">Platform</p>
            <div className="grid grid-cols-2 gap-2">
              {(["youtube", "instagram"] as const).map((p) => {
                const m = PLATFORM_META[p];
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                      platform === p ? `${m.activeBg} ${m.border} ${m.color}` : "border-gray-800 text-gray-500 hover:border-gray-700"
                    }`}
                  >
                    <FontAwesomeIcon icon={m.icon} />
                    <span className="text-xs tracking-wide">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label */}
          <div>
            <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-1.5">Label</p>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={platform === "youtube" ? "e.g. Live Stream" : "e.g. Winners Post"}
              className={inputCls}
            />
          </div>

          {/* URL */}
          <div>
            <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-1.5">URL</p>
            <div className="relative">
              <FontAwesomeIcon icon={faLink} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={platform === "youtube" ? "https://youtube.com/live/..." : "https://instagram.com/p/..."}
                className={inputCls + " pl-8"}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsLive((v) => !v)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all duration-150 ${
                isLive ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-gray-800 text-gray-600 hover:border-gray-700"
              }`}
            >
              <FontAwesomeIcon icon={faCircleDot} className={isLive ? "animate-pulse" : ""} />
              {isLive ? "Marked LIVE" : "Mark as Live"}
            </button>
            <button
              onClick={() => setIsActive((v) => !v)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all duration-150 ${
                isActive ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-gray-800 text-gray-600 hover:border-gray-700"
              }`}
            >
              <FontAwesomeIcon icon={isActive ? faToggleOn : faToggleOff} />
              {isActive ? "Active" : "Inactive"}
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className={`flex-1 py-2.5 text-xs tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 ${
                valid && !saving ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00]" : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />}
              <FontAwesomeIcon icon={faFloppyDisk} className="text-[10px]" />
              {isEdit ? "Save Changes" : "Add Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function AdminSocialMedia() {
  const [links,   setLinks]   = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<{ mode: "add" } | { mode: "edit"; link: SocialLink } | null>(null);
  const [visible, setVisible] = useState(false);
  const [toast,   setToast]   = useState({ msg: "", show: false });

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch("/api/admin/social-media", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); setTimeout(() => setVisible(true), 60); }, []);

  const handleAdd = async (data: Omit<SocialLink, "id">) => {
    const res = await authFetch("/api/admin/social-media", {
      method: "POST",
      body:   JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
    await fetchLinks();
    setModal(null);
    showToast("Link added ✓");
  };

  const handleEdit = async (id: number, data: Omit<SocialLink, "id">) => {
    const res = await authFetch(`/api/admin/social-media/${id}`, {
      method: "PATCH",
      body:   JSON.stringify(data),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
    await fetchLinks();
    setModal(null);
    showToast("Link updated ✓");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this link?")) return;
    await authFetch(`/api/admin/social-media/${id}`, { method: "DELETE" });
    await fetchLinks();
    showToast("Link deleted");
  };

  const handleToggleActive = async (link: SocialLink) => {
    await authFetch(`/api/admin/social-media/${link.id}`, {
      method: "PATCH",
      body:   JSON.stringify({ is_active: !link.is_active }),
    });
    await fetchLinks();
  };

  const handleToggleLive = async (link: SocialLink) => {
    await authFetch(`/api/admin/social-media/${link.id}`, {
      method: "PATCH",
      body:   JSON.stringify({ is_live: !link.is_live }),
    });
    await fetchLinks();
  };

  const youtube   = links.filter((l) => l.platform === "youtube");
  const instagram = links.filter((l) => l.platform === "instagram");

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-xs px-5 py-3 rounded-lg shadow-lg tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {/* MODAL */}
      {modal?.mode === "add" && (
        <LinkModal onSave={handleAdd} onClose={() => setModal(null)} />
      )}
      {modal?.mode === "edit" && (
        <LinkModal
          initial={modal.link}
          onSave={(data) => handleEdit(modal.link.id, data)}
          onClose={() => setModal(null)}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}
        <div className={`flex items-center justify-between transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <div>
            <h1 className="text-xl tracking-widest text-white">Social Media</h1>
            <p className="text-gray-600 text-xs mt-1">Manage YouTube & Instagram links shown on the homepage</p>
          </div>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="bg-[#F2AA00] text-black px-4 py-2.5 text-xs tracking-widest rounded-lg hover:bg-[#e09e00] active:scale-[0.97] transition-all duration-150 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Add Link
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-600 w-5 h-5" />
          </div>
        ) : (
          <>
            {/* YOUTUBE SECTION */}
            <PlatformSection
              platform="youtube"
              links={youtube}
              visible={visible}
              onEdit={(l) => setModal({ mode: "edit", link: l })}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onToggleLive={handleToggleLive}
            />

            {/* INSTAGRAM SECTION */}
            <PlatformSection
              platform="instagram"
              links={instagram}
              visible={visible}
              onEdit={(l) => setModal({ mode: "edit", link: l })}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onToggleLive={handleToggleLive}
            />

            {links.length === 0 && (
              <div className="text-center py-20 text-gray-700 text-xs tracking-widest">
                No links yet. Click "Add Link" to get started.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── PLATFORM SECTION ──────────────────────────────────────
function PlatformSection({
  platform, links, visible, onEdit, onDelete, onToggleActive, onToggleLive,
}: {
  platform: "youtube" | "instagram";
  links: SocialLink[];
  visible: boolean;
  onEdit: (l: SocialLink) => void;
  onDelete: (id: number) => void;
  onToggleActive: (l: SocialLink) => void;
  onToggleLive: (l: SocialLink) => void;
}) {
  const meta = PLATFORM_META[platform];
  if (links.length === 0) return null;

  return (
    <div className={`space-y-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={meta.icon} className={`${meta.color} text-lg`} />
        <p className="text-sm text-white tracking-widest uppercase">{meta.label}</p>
        <span className="text-[10px] text-gray-600 border border-gray-800 px-1.5 py-0.5 rounded-full">{links.length}</span>
      </div>

      {links.map((link) => (
        <div
          key={link.id}
          className={`bg-[#0b0b0b] border rounded-xl px-4 py-3.5 transition-all duration-200 ${
            link.is_active ? `${meta.border}` : "border-gray-800 opacity-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
              <FontAwesomeIcon icon={meta.icon} className={`${meta.color} text-base`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-white">{link.label}</p>
                {link.is_live && (
                  <span className="flex items-center gap-1 text-[9px] text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded-full tracking-widest">
                    <FontAwesomeIcon icon={faCircleDot} className="animate-pulse" />
                    LIVE
                  </span>
                )}
                {!link.is_active && (
                  <span className="text-[9px] text-gray-600 border border-gray-800 px-1.5 py-0.5 rounded-full tracking-widest">
                    INACTIVE
                  </span>
                )}
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className={`text-[11px] truncate block mt-0.5 hover:underline ${meta.color}`}
              >
                {link.url}
              </a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Live toggle */}
              <button
                onClick={() => onToggleLive(link)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150 text-[10px] ${
                  link.is_live ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-gray-800 text-gray-600 hover:border-red-500/20 hover:text-red-400"
                }`}
                title={link.is_live ? "Unmark live" : "Mark as live"}
              >
                <FontAwesomeIcon icon={faCircleDot} />
              </button>

              {/* Active toggle */}
              <button
                onClick={() => onToggleActive(link)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150 text-[10px] ${
                  link.is_active ? "border-green-500/20 text-green-400 bg-green-500/5" : "border-gray-800 text-gray-600 hover:border-green-500/20 hover:text-green-400"
                }`}
                title={link.is_active ? "Deactivate" : "Activate"}
              >
                <FontAwesomeIcon icon={link.is_active ? faToggleOn : faToggleOff} />
              </button>

              {/* Edit */}
              <button
                onClick={() => onEdit(link)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-[#F2AA00]/40 hover:text-[#F2AA00] transition-all duration-150"
                title="Edit"
              >
                <FontAwesomeIcon icon={faPencil} className="text-[10px]" />
              </button>

              {/* Delete */}
              <button
                onClick={() => onDelete(link.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-red-500/30 hover:text-red-400 transition-all duration-150"
                title="Delete"
              >
                <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}