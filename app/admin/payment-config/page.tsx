"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQrcode, faPen, faFloppyDisk, faSpinner,
  faCloudArrowUp, faCheck, faTrash, faCircleExclamation,
  faMobileScreen, faUser, faStickyNote,
} from "@fortawesome/free-solid-svg-icons";
import { getAuth } from "firebase/auth";

type PaymentConfig = {
  upi_id:   string;
  upi_name: string;
  qr_url:   string;
  note:     string;
};

async function getToken() {
  const auth = getAuth();
  return await auth.currentUser?.getIdToken(true) ?? localStorage.getItem("token") ?? "";
}

const inputCls = "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors duration-200";

export default function AdminPaymentConfig() {
  const [config,    setConfig]    = useState<PaymentConfig>({ upi_id: "", upi_name: "", qr_url: "", note: "" });
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [qrFile,    setQrFile]    = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [visible,   setVisible]   = useState(false);
  const [toast,     setToast]     = useState({ msg: "", ok: true, show: false });
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  // ── fetch current config ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const res   = await fetch("/api/admin/payment-config", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConfig({
          upi_id:   data.upi_id   ?? "",
          upi_name: data.upi_name ?? "",
          qr_url:   data.qr_url   ?? "",
          note:     data.note     ?? "",
        });
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      }
    };
    load();
  }, []);

  // ── QR file pick ──────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please select an image file", false); return; }
    if (file.size > 2 * 1024 * 1024)    { showToast("Image must be under 2 MB", false);     return; }
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const clearQrFile = () => {
    setQrFile(null);
    setQrPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── save ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!config.upi_id.trim()) { showToast("UPI ID is required", false); return; }
    setSaving(true);
    try {
      const token    = await getToken();
      const formData = new FormData();
      formData.append("upi_id",   config.upi_id.trim());
      formData.append("upi_name", config.upi_name.trim());
      formData.append("note",     config.note.trim());
      if (qrFile) formData.append("qr_image", qrFile);

      const res  = await fetch("/api/admin/payment-config", {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();

      if (!res.ok) { showToast(data.error ?? "Save failed", false); return; }

      // Update config with fresh values from server
      setConfig({
        upi_id:   data.config.upi_id,
        upi_name: data.config.upi_name,
        qr_url:   data.config.qr_url,
        note:     data.config.note,
      });
      clearQrFile();
      showToast("Payment config saved ✓");
    } catch {
      showToast("Save failed. Try again.", false);
    } finally {
      setSaving(false);
    }
  };

  // live QR display — new upload takes priority over saved
  const displayQr = qrPreview ?? (config.qr_url || null);

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 z-50 text-xs px-5 py-3 rounded-lg shadow-lg tracking-widest transition-all duration-500 ${
        toast.ok ? "bg-[#F2AA00] text-black" : "bg-red-500/90 text-white"
      } ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* HEADER */}
        <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <h1 className="text-xl tracking-widest text-white">Payment Config</h1>
          <p className="text-gray-600 text-xs mt-1 tracking-wide">
            Set your UPI ID and QR code — shown to players on the registration page
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-600 w-5 h-5" />
          </div>
        ) : (
          <div className={`space-y-5 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>

            {/* ── QR IMAGE CARD ────────────────────────────────── */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faQrcode} className="text-[#F2AA00] text-sm" />
                <p className="text-sm text-white tracking-wide">QR Code</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-start">

                {/* QR preview */}
                <div className="flex-shrink-0">
                  {displayQr ? (
                    <div className="relative group">
                      <div className="w-44 h-44 rounded-xl border border-[#F2AA00]/30 bg-white p-2 overflow-hidden">
                        <img
                          src={displayQr}
                          alt="Payment QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {/* overlay on hover */}
                      <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="w-8 h-8 rounded-lg bg-[#F2AA00] text-black flex items-center justify-center hover:bg-[#e09e00] transition-colors"
                          title="Change"
                        >
                          <FontAwesomeIcon icon={faPen} className="text-xs" />
                        </button>
                        {qrPreview && (
                          <button
                            onClick={clearQrFile}
                            className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                            title="Remove new upload"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        )}
                      </div>
                      {/* new badge */}
                      {qrPreview && (
                        <div className="absolute -top-2 -right-2 bg-[#F2AA00] text-black text-[8px] tracking-widest px-1.5 py-0.5 rounded-full">
                          NEW
                        </div>
                      )}
                    </div>
                  ) : (
                    /* empty state */
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-44 h-44 rounded-xl border-2 border-dashed border-gray-800 hover:border-[#F2AA00]/30 transition-colors flex flex-col items-center justify-center gap-2 group"
                    >
                      <FontAwesomeIcon icon={faQrcode} className="text-gray-700 text-3xl group-hover:text-[#F2AA00]/40 transition-colors" />
                      <p className="text-[10px] text-gray-700 tracking-widest group-hover:text-gray-500 transition-colors">
                        Upload QR
                      </p>
                    </button>
                  )}
                </div>

                {/* Upload instructions */}
                <div className="flex-1 space-y-3">
                  <div className="bg-black border border-gray-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-white tracking-wide">Upload QR Code</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Upload a clear QR code image. Players will scan this on the registration page to pay the entry fee.
                    </p>
                    <ul className="space-y-1">
                      {["PNG, JPG, or WebP", "Max size: 2 MB", "Recommended: 500×500px or larger", "White background preferred"].map((t, i) => (
                        <li key={i} className="flex items-center gap-2 text-[10px] text-gray-600">
                          <div className="w-1 h-1 rounded-full bg-gray-700 flex-shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-800 text-gray-400 rounded-lg text-xs tracking-widest hover:border-[#F2AA00]/40 hover:text-[#F2AA00] transition-all duration-150"
                  >
                    <FontAwesomeIcon icon={faCloudArrowUp} />
                    {displayQr ? "Change QR Image" : "Upload QR Image"}
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            {/* ── UPI DETAILS CARD ─────────────────────────────── */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon icon={faMobileScreen} className="text-[#F2AA00] text-sm" />
                <p className="text-sm text-white tracking-wide">UPI Details</p>
              </div>

              {/* UPI ID */}
              <div>
                <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-1.5">UPI ID *</p>
                <div className="relative">
                  <FontAwesomeIcon icon={faMobileScreen} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                  <input
                    value={config.upi_id}
                    onChange={(e) => setConfig((c) => ({ ...c, upi_id: e.target.value }))}
                    placeholder="yourname@paytm or yourname@upi"
                    className={inputCls + " pl-8 font-mono"}
                  />
                </div>
              </div>

              {/* UPI Name */}
              <div>
                <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-1.5">Display Name</p>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                  <input
                    value={config.upi_name}
                    onChange={(e) => setConfig((c) => ({ ...c, upi_name: e.target.value }))}
                    placeholder="e.g. Your Tournament Name"
                    className={inputCls + " pl-8"}
                  />
                </div>
                <p className="text-[10px] text-gray-700 mt-1">Shown above the QR on registration page</p>
              </div>

              {/* Note */}
              <div>
                <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-1.5">Payment Note</p>
                <div className="relative">
                  <FontAwesomeIcon icon={faStickyNote} className="absolute left-3 top-3 text-gray-600 text-xs pointer-events-none" />
                  <textarea
                    value={config.note}
                    onChange={(e) => setConfig((c) => ({ ...c, note: e.target.value }))}
                    placeholder="e.g. Add your Team Name as payment note while paying"
                    rows={2}
                    className={inputCls + " pl-8 resize-none"}
                  />
                </div>
              </div>
            </div>

            {/* ── PREVIEW CARD ─────────────────────────────────── */}
            {(config.upi_id || displayQr) && (
              <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
                <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-4">Preview — as seen by players</p>
                <div className="bg-black border border-gray-800 rounded-xl p-4">
                  <PaymentPreview config={config} qrDisplay={displayQr} />
                </div>
              </div>
            )}

            {/* SAVE BUTTON */}
            <button
              onClick={handleSave}
              disabled={saving || !config.upi_id.trim()}
              className={`w-full py-3 rounded-xl text-sm tracking-widest transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 ${
                !saving && config.upi_id.trim()
                  ? "bg-[#F2AA00] text-black hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20"
                  : "bg-gray-900 border border-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              {saving
                ? <FontAwesomeIcon icon={faSpinner} className="animate-spin w-4 h-4" />
                : <FontAwesomeIcon icon={faFloppyDisk} />
              }
              {saving ? "Saving..." : "Save Payment Config"}
            </button>

            {/* tip */}
            <div className="flex items-start gap-2 text-[10px] text-gray-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 flex-shrink-0" />
              <p>Changes take effect immediately — new registrations will see the updated QR and UPI ID.</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ── PREVIEW COMPONENT (mirrors register page layout) ─────
function PaymentPreview({ config, qrDisplay }: { config: PaymentConfig; qrDisplay: string | null }) {
  return (
    <div className="space-y-3">
      {config.upi_name && (
        <p className="text-[10px] text-gray-500 tracking-widest uppercase text-center">{config.upi_name}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* QR */}
        {qrDisplay && (
          <div className="w-32 h-32 rounded-xl border border-[#F2AA00]/20 bg-white p-1.5 flex-shrink-0">
            <img src={qrDisplay} alt="QR Preview" className="w-full h-full object-contain" />
          </div>
        )}

        <div className="flex-1 space-y-2 w-full">
          {/* UPI ID copy block */}
          <div className="flex items-center justify-between bg-[#0b0b0b] border border-[#F2AA00]/20 rounded-lg px-3 py-2.5">
            <div>
              <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-0.5">UPI ID</p>
              <p className="text-sm text-[#F2AA00] font-mono">{config.upi_id || "yourname@upi"}</p>
            </div>
            <div className="w-6 h-6 rounded border border-[#F2AA00]/20 bg-[#F2AA00]/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="text-[#F2AA00] text-[8px]" />
            </div>
          </div>

          {config.note && (
            <div className="flex items-start gap-2 bg-[#F2AA00]/5 border border-[#F2AA00]/10 rounded-lg px-3 py-2">
              <FontAwesomeIcon icon={faCircleExclamation} className="text-[#F2AA00]/60 text-[10px] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-gray-500 leading-relaxed">{config.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}