"use client";

import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck, faCloudArrowUp, faCircleExclamation,
  faUser, faHashtag, faEnvelope, faMobileScreen,
  faShield, faCopy, faQrcode, faIndianRupeeSign,
  faStar, faCoins, faTrophy, faCrosshairs, faArrowRight,
  faDownload, faX, faExpand,
} from "@fortawesome/free-solid-svg-icons";

const ALL_MAPS = [
  { name: "Erangel", src: "/maps/Erangle.jpg"  },
  { name: "Miramar", src: "/maps/miramar.jpg"  },
  { name: "Sanhok",  src: "/maps/Sanhok.jpg"   },
  { name: "Vikendi", src: "/maps/Vikendi.jpg"  },
  { name: "Livik",     src: "/maps/livik.png" },
  { name: "Rondo",     src: "/maps/rondo.png" },
  { name: "Warehouse", src: "/maps/warehouse.jpg" },
];

const inputCls =
  "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors duration-200";

type PaymentConfig = {
  upiId:   string;
  upiName: string;
  qrUrl:   string;
  note:    string;
};

type PreviousTeam = {
  team_name: string;
  team_tag:  string;
  players:   { player_name: string; player_id: string; is_captain: boolean }[];
};

// ✅ NEW: Type for points configuration from database
type PointsConfig = {
  placement: Record<string, Record<string, number>>;
  kill_points: number;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-0.5 h-4 bg-[#F2AA00] rounded-full" />
      <p className="text-[13px] text-gray-500 tracking-[0.2em] uppercase">{children}</p>
    </div>
  );
}

function PlayerSlot({ index, value, onChange, isCaptain = false }: any) {
  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      isCaptain ? "border-[#F2AA00]/30 bg-[#F2AA00]/5" : "border-gray-800 bg-black/30 hover:border-gray-700"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 ${
          isCaptain ? "bg-[#F2AA00] text-black" : "bg-gray-800 text-gray-400"
        }`}>
          {isCaptain ? "C" : index}
        </div>
        <span className="text-[13px] text-gray-500 tracking-widest uppercase">
          {isCaptain ? "Captain (You)" : `Player ${index}`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
          <input placeholder="In-game Name" value={value.name} onChange={(e) => onChange("name", e.target.value)} className={inputCls + " pl-8 text-[14px]"} />
        </div>
        <div className="relative">
          <FontAwesomeIcon icon={faHashtag} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
          <input placeholder="Player ID" value={value.id} onChange={(e) => onChange("id", e.target.value)} className={inputCls + " pl-8"} />
        </div>
      </div>
      {!isCaptain && (
        <p className="text-[10px] text-gray-700 mt-2">Optional — leave empty to skip</p>
      )}
    </div>
  );
}

// ── QR CODE MODAL ─────────────────────────────────────
function QRCodeModal({ qrUrl, upiName, onClose }: { qrUrl: string; upiName: string; onClose: () => void }) {
  const downloadQR = async () => {
    try {
      const a = document.createElement("a");
      a.href = qrUrl;
      a.download = `${upiName || "payment"}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl overflow-hidden max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#F2AA00]/8">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faQrcode} className="text-[#F2AA00] text-lg" />
            <h2 className="text-white text-sm tracking-wide ">{upiName || "Payment QR"}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <FontAwesomeIcon icon={faX} className="text-lg" />
          </button>
        </div>

        {/* QR Image */}
        <div className="p-6 bg-black/40">
          <div className="bg-white rounded-xl p-4 border-2 border-[#F2AA00]/40 shadow-lg shadow-[#F2AA00]/10">
            <img src={qrUrl} alt="Payment QR Code" className="w-full" />
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-3 tracking-[0.2em] uppercase">Scan to Pay</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800 bg-black/20">
          <button
            onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F2AA00] text-black py-2.5 rounded-lg text-xs tracking-widest  hover:bg-[#e09e00] transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={faDownload} className="text-sm" />
            Download QR
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-lg text-xs tracking-widest hover:border-gray-600 hover:text-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── POINTS TABLE ──────────────────────────────────────────
// ✅ UPDATED: Now uses pointsConfig from props instead of lib/points
function PointsTable({ mode, pointsConfig }: { mode: string; pointsConfig: PointsConfig | null }) {
  if (!pointsConfig) {
    return (
      <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-4">
        <SectionLabel>Points System</SectionLabel>
        <p className="text-xs text-gray-500">Loading points configuration...</p>
      </div>
    );
  }

  const m = mode?.toLowerCase() ?? "team";
  const placementData = pointsConfig.placement[m] || pointsConfig.placement["team"];
  const killPoints = pointsConfig.kill_points;

  // Convert placement data to array format for display
  const placements = Object.entries(placementData).map(([position, points]) => ({
    pos: position,
    pts: points,
  }));

  return (
    <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-4">
      <SectionLabel>Points System</SectionLabel>

      {/* Placement points */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00] text-xs" />
          <p className="text-[11px] text-gray-500 tracking-widest uppercase">Placement Points</p>
        </div>
        <div className="rounded-lg overflow-hidden border border-gray-800">
          {placements.map((row, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2 text-xs ${
              i % 2 === 0 ? "bg-black/40" : "bg-black/20"
            } ${i === 0 ? "border-b border-[#F2AA00]/20" : ""}`}>
              <span className={`${i === 0 ? "text-[#F2AA00] " : "text-gray-400"}`}>
                {row.pos === "1" ? "🥇 1st" : row.pos === "2" ? "🥈 2nd" : row.pos === "3" ? "🥉 3rd" : row.pos}
              </span>
              <span className={`xmono  ${i === 0 ? "text-[#F2AA00]" : "text-gray-300"}`}>{row.pts} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kill points */}
      <div className="flex items-center gap-2 bg-black/40 border border-gray-800 rounded-lg px-3 py-2.5">
        <FontAwesomeIcon icon={faCrosshairs} className="text-red-400 text-xs flex-shrink-0" />
        <p className="text-xs text-gray-400">Each kill = <span className="text-white font-mono ">{killPoints} pts</span></p>
      </div>

      {/* Example calc - use first placement position for example */}
      {placements.length > 0 && (
        <div className="mt-3 bg-[#F2AA00]/5 border border-[#F2AA00]/15 rounded-lg px-3 py-2.5">
          <p className="text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Example</p>
          <p className="text-xs text-gray-400">
            1st place + 5 kills = <span className="text-[#F2AA00] font-mono ">
              {placements[0].pts + (killPoints * 5)} pts
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── PAYMENT BLOCK ────────────────────────────────────────
function PaymentBlock({ config, fee }: { config: PaymentConfig; fee: number }) {
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const hasUpi = config.upiId.trim().length > 0;
  const hasQr  = config.qrUrl.trim().length > 0;
  const feeStr = `₹${fee}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(config.upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <>
      <div className="rounded-xl border border-[#F2AA00]/25 overflow-hidden bg-black">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F2AA00]/8 border-b border-[#F2AA00]/15">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faQrcode} className="text-[#F2AA00]" />
            <span className="text-sm text-white tracking-wide">
              {config.upiName || "Pay Entry Fee"}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-[#F2AA00] text-black text-xs  px-2.5 py-0.5 rounded-full font-mono">
            <FontAwesomeIcon icon={faIndianRupeeSign} className="text-[10px]" />
            {fee}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {(hasQr || hasUpi) ? (
            <div className={`flex gap-5 ${hasQr ? "flex-col sm:flex-row items-start" : "flex-col"}`}>
              {hasQr && (
                <div className="flex-shrink-0 flex flex-col items-center">
                  {/* Thumbnail with expand button */}
                  <div className="relative">
                    <div className="w-40 h-40 bg-white rounded-xl border-2 border-[#F2AA00]/30 p-2 shadow-lg shadow-[#F2AA00]/10">
                      <img src={config.qrUrl} alt="Payment QR Code" className="w-full h-full object-contain" />
                    </div>
                    {/* Expand button */}
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-[#F2AA00] text-[#F2AA00] hover:text-black p-2 rounded-lg transition-all border border-[#F2AA00]/40 hover:border-[#F2AA00]"
                      title="View full QR code"
                    >
                      <FontAwesomeIcon icon={faExpand} className="text-xs" />
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-600 tracking-[0.2em] mt-2 uppercase">Scan to Pay</p>
                </div>
              )}
              <div className="flex-1 w-full space-y-3">
                {hasUpi && (
                  <div>
                    <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1.5">UPI ID</p>
                    <button type="button" onClick={copyUpi}
                      className="w-full flex items-center justify-between bg-[#0d0d0d] border border-gray-800 hover:border-[#F2AA00]/40 rounded-lg px-3 py-2.5 transition-all duration-150 group">
                      <span className="text-sm text-[#F2AA00] font-mono tracking-wide">{config.upiId}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                        copied ? "bg-green-500/20 border-green-500/30" : "bg-gray-900 border-gray-700 group-hover:border-[#F2AA00]/40"
                      }`}>
                        <FontAwesomeIcon icon={copied ? faCheck : faCopy}
                          className={`text-[10px] ${copied ? "text-green-400" : "text-gray-500 group-hover:text-[#F2AA00]"}`} />
                      </div>
                    </button>
                    {copied && <p className="text-[10px] text-green-400 mt-1 tracking-widest">Copied ✓</p>}
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-2">How to pay</p>
                  <div className="space-y-2">
                    {[
                      "Open GPay, PhonePe, Paytm or any UPI app",
                      hasQr ? "Scan the QR code" : hasUpi ? "Search or enter the UPI ID above" : "Make the payment via UPI",
                      `Pay exactly ${feeStr} — not more, not less`,
                      "Screenshot the payment success screen",
                      "Upload it below and enter the Transaction ID",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#F2AA00]/10 border border-[#F2AA00]/25 flex items-center justify-center text-[9px] text-[#F2AA00] flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 bg-[#F2AA00]/5 border border-[#F2AA00]/15 rounded-lg px-4 py-3">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-[#F2AA00]/70 text-sm mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-400 leading-relaxed">
                  Pay <span className="text-[#F2AA00] font-mono ">{feeStr}</span> via UPI to the organiser, then upload your payment screenshot and enter the Transaction ID below.
                </p>
              </div>
            </div>
          )}
          {config.note && (
            <div className="flex items-start gap-2 bg-[#F2AA00]/5 border border-[#F2AA00]/15 rounded-lg px-3 py-2.5">
              <FontAwesomeIcon icon={faCircleExclamation} className="text-[#F2AA00]/70 text-xs mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">{config.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <QRCodeModal
          qrUrl={config.qrUrl}
          upiName={config.upiName}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params.id as string;

  const [authChecked,    setAuthChecked]    = useState<boolean | null>(null);
  const [tournament,     setTournament]     = useState<any>(null);
  const [paymentConfig,  setPaymentConfig]  = useState<PaymentConfig>({ upiId: "", upiName: "", qrUrl: "", note: "" });
  const [visible,        setVisible]        = useState(false);
  const [captain,        setCaptain]        = useState({ name: "", id: "" });
  const [email,          setEmail]          = useState("");
  const [teamName,       setTeamName]       = useState("");
  const [upi,            setUpi]            = useState("");
  const [txn,            setTxn]            = useState("");
  const [screenshot,     setScreenshot]     = useState<File | null>(null);
  const [players,        setPlayers]        = useState<{ name: string; id: string }[]>([]);
  const [submitted,      setSubmitted]      = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);

  // ── Redeem points state ──
  const [userPoints,     setUserPoints]     = useState<number>(0);
  const [pointsLoaded,   setPointsLoaded]   = useState(false);
  const [useRedeem,      setUseRedeem]      = useState(false);

  // ✅ NEW: Points config state
  const [pointsConfig,   setPointsConfig]   = useState<PointsConfig | null>(null);

  // ── Previous team state ──
  const [prevTeams,      setPrevTeams]      = useState<PreviousTeam[]>([]);
  const [selectedTeam,   setSelectedTeam]   = useState<string>("");

  // AUTH GUARD
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(`/login?message=Please login to continue&redirect=/tournaments/${id}/register`);
    } else {
      setAuthChecked(true);
    }
  }, []);

  // FETCH tournament + payment config + user points + previous teams + points config
  useEffect(() => {
    if (!authChecked || !id) return;

    const token = localStorage.getItem("token");

    // Tournament data
    fetch(`/api/tournaments/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const raw            = data.tournament ?? data.data;
        
        // ✅ FIX: Parse startFormatted correctly
        // API returns: "21 Mar 2026 · 6:00 PM" or "21 MAR · 6:00 PM"
        const startFormatted = raw.startFormatted ?? "TBA";
        let date = "TBA";
        let time = "TBA";
        
        if (startFormatted !== "TBA" && startFormatted.includes("·")) {
          const [datePart, timePart] = startFormatted.split("·").map((s: string) => s.trim());
          date = datePart;
          time = timePart + " IST"; // Add IST suffix since API doesn't include it
        }

        setTournament({
          id:          raw.id,
          name:        raw.title,
          map:         raw.map,
          mode:        raw.mode
            ? raw.mode.charAt(0).toUpperCase() + raw.mode.slice(1).toLowerCase()
            : "Squad",
          platform:    raw.game === "BGMI" ? "BGMI" : "PUBG",
          playerCount:
            raw.mode?.toLowerCase() === "solo" ? 1
            : raw.mode?.toLowerCase() === "duo" ? 2 : 4,
          fee:    raw.entry_fee ?? raw.fee ?? 0,
          slots:  raw.total_slots  ?? raw.slots  ?? 0,
          filled: raw.filled_slots ?? raw.filled  ?? 0,
          date, 
          time,
          mapImage: ALL_MAPS.find(
            (m) => m.name.toLowerCase() === raw.map?.toLowerCase()
          )?.src ?? "/miramar.jpg",
        });

        const pc = data.paymentConfig;
        if (pc) {
          setPaymentConfig({
            upiId:   pc.upiId   ?? "",
            upiName: pc.upiName ?? "",
            qrUrl:   pc.qrUrl   ?? "",
            note:    pc.note    ?? "",
          });
        }
      })
      .catch(console.error);

    // User points — try /api/user/points first, fall back to /api/user/me
    const fetchUserPoints = async () => {
      try {
        // Try dedicated points endpoint first
        const r1 = await fetch("/api/user/points", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r1.ok) {
          const d1 = await r1.json();
          const pts =
            d1?.total_points ??
            d1?.points ??
            d1?.user?.total_points ??
            null;
          if (pts !== null) { setUserPoints(Number(pts)); return; }
        }
      } catch (_) {}

      try {
        // Fall back to /api/user/me
        const r2 = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r2.ok) {
          const d2 = await r2.json();
          // Try every common response shape
          const pts =
            d2?.user?.total_points ??
            d2?.total_points ??
            d2?.data?.total_points ??
            d2?.profile?.total_points ??
            0;
          setUserPoints(Number(pts));
        }
      } catch (e) {
        console.error("Failed to fetch user points:", e);
      }
    };
    fetchUserPoints().finally(() => setPointsLoaded(true));

    // ✅ NEW: Fetch points configuration from database
    const fetchPointsConfig = async () => {
      try {
        const res = await fetch("/api/points-config");
        if (res.ok) {
          const data = await res.json();
          // Extract placement and kill_points from the response
          const config: PointsConfig = {
            placement: data.pointsConfig?.placement || data.placement || {},
            kill_points: data.pointsConfig?.kill_points ?? data.kill_points ?? 5,
          };
          setPointsConfig(config);
        } else {
          console.error("Failed to fetch points config:", res.status);
          // Set default points config if API fails
          setPointsConfig({
            placement: {
              solo: { "1": 500, "2": 400, "3": 300, "4": 200, "5": 100, "6-10": 75, "11-15": 50, "16-20": 30 },
              duo: { "1": 500, "2": 400, "3": 300, "4": 200, "5-10": 100, "11-15": 50 },
              team: { "1": 500, "2": 400, "3": 300, "4": 200, "5": 180, "6-10": 75 },
            },
            kill_points: 5,
          });
        }
      } catch (e) {
        console.error("Error fetching points config:", e);
        // Fallback to default config
        setPointsConfig({
          placement: {
            solo: { "1": 500, "2": 400, "3": 300, "4": 200, "5": 100, "6-10": 75, "11-15": 50, "16-20": 30 },
            duo: { "1": 500, "2": 400, "3": 300, "4": 200, "5-10": 100, "11-15": 50 },
            team: { "1": 500, "2": 400, "3": 300, "4": 200, "5": 180, "6-10": 75 },
          },
          kill_points: 5,
        });
      }
    };
    fetchPointsConfig();

    // Previous teams from user's past registrations
    fetch("/api/user/teams", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setPrevTeams(data?.teams ?? []);
      })
      .catch(console.error);

    setTimeout(() => setVisible(true), 80);
  }, [authChecked, id]);

  useEffect(() => {
    if (!tournament) return;
    setPlayers(
      Array.from({ length: tournament.playerCount - 1 }, () => ({ name: "", id: "" }))
    );
  }, [tournament]);

  // Apply selected previous team
  const applyPreviousTeam = (teamName: string) => {
    const found = prevTeams.find((t) => t.team_name === teamName);
    if (!found) return;
    setSelectedTeam(teamName);
    setTeamName(found.team_name);
    const cap = found.players.find((p) => p.is_captain);
    if (cap) setCaptain({ name: cap.player_name, id: cap.player_id });
    const others = found.players.filter((p) => !p.is_captain);
    setPlayers(
      others.slice(0, tournament.playerCount - 1).map((p) => ({
        name: p.player_name,
        id:   p.player_id,
      }))
    );
  };

  const updatePlayer = (idx: number, field: "name" | "id", val: string) =>
    setPlayers((p) => p.map((pl, i) => (i === idx ? { ...pl, [field]: val } : pl)));

  const playersValid = () => {
    if (!captain.name || !captain.id) return false;
    // ✅ FIX: Optional players - if a player field is filled, both must be filled
    // But if completely empty, it's fine (skip that player)
    return players.every((p) => {
      const hasName = p.name.trim() !== "";
      const hasId   = p.id.trim()   !== "";
      if (hasName || hasId) return hasName && hasId; // partial = invalid
      return true; // completely empty = valid (skip)
    });
  };

  // ✅ FIX: Only send players that are actually filled
  const getFilledPlayers = () => {
    const filledPlayers = players.filter(p => p.name.trim() !== "" || p.id.trim() !== "");
    return [
      { player_name: captain.name, player_id: captain.id, is_captain: true },
      ...filledPlayers.map((p) => ({ 
        player_name: p.name, 
        player_id: p.id, 
        is_captain: false 
      })),
    ];
  };

  const slotPercent = tournament ? Math.round((tournament.filled / tournament.slots) * 100) : 0;
  const slotsLeft   = tournament ? tournament.slots - tournament.filled : 0;


  // Redeem: allow when user has >= entry fee points (full fee is deducted, no partial)
  const canRedeem   = tournament !== null && userPoints >= (tournament?.fee ?? Infinity);
  const redeemValid = useRedeem && canRedeem;

  const isValid =
    tournament !== null &&
    (tournament.playerCount > 1 ? teamName.trim() !== "" : true) &&
    playersValid() &&
    email.trim() !== "" &&
    (
      // Redeem path: no UPI/txn/screenshot needed
      redeemValid ||
      // Normal payment path
      (upi.trim() !== "" && txn.trim() !== "" && screenshot !== null)
    );

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsLoading(true);  // ← Start loading
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        router.replace(`/login?message=Session expired&redirect=/tournaments/${id}/register`);
        return;
      }
      
      // ✅ FIX: Only send filled players
      const allPlayers = getFilledPlayers();

      const formData = new FormData();
      formData.append("team_name",
        tournament.playerCount === 1 ? `${captain.name} - Solo` : teamName);
      formData.append("team_tag",
        tournament.playerCount === 1 ? "SOLO" : teamName?.slice(0, 4));
      formData.append("players",        JSON.stringify(allPlayers));
      formData.append("use_redeem",     useRedeem ? "true" : "false");

      if (!useRedeem) {
        formData.append("upi_id",         upi);
        formData.append("transaction_id", txn);
        if (screenshot) formData.append("screenshot", screenshot);
      }

      const res  = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.status === 401) {
        setIsLoading(false);
        localStorage.removeItem("token");
        router.replace(`/login?message=Session expired&redirect=/tournaments/${id}/register`);
        return;
      }
      if (!res.ok) { 
        setIsLoading(false);
        alert(data.error || "Registration failed"); 
        return; 
      }
      setSubmitted(true);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      alert("Something went wrong");
    }
  };

  if (authChecked === null) return <div className="bg-black min-h-screen" />;

  // ── LOADING SCREEN ──
  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background glow */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#F2AA00]/8 blur-[120px] animate-pulse" />
        </div>

        <div className="text-center space-y-6 max-w-sm w-full relative z-10">
          {/* Animated spinner */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#F2AA00] border-r-[#F2AA00] animate-spin" />
              {/* Middle ring (slower) */}
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#F2AA00]/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#F2AA00]" />
              </div>
            </div>
          </div>

          {/* Loading text */}
          <div className="space-y-2">
            <h2 className="text-xl tracking-wide">Processing Registration</h2>
            <p className="text-sm text-gray-400">
              Verifying your details and saving your slot...
            </p>
          </div>

          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-600 tracking-widest uppercase">
              <span>Please wait</span>
              <span>~3-5 seconds</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-transparent via-[#F2AA00] to-transparent rounded-full animate-pulse w-full" />
            </div>
          </div>

          {/* Info text */}
          <div className="space-y-2 text-left">
            <div className="flex items-start gap-2.5 bg-[#F2AA00]/5 border border-[#F2AA00]/15 rounded-lg px-3 py-2.5">
              <div className="w-4 h-4 rounded-full bg-[#F2AA00]/20 border border-[#F2AA00]/40 flex items-center justify-center text-[8px] text-[#F2AA00] flex-shrink-0 mt-0.5">
                ✓
              </div>
              <p className="text-xs text-gray-400">
                Team details saved
              </p>
            </div>
            <div className="flex items-start gap-2.5 bg-[#F2AA00]/5 border border-[#F2AA00]/15 rounded-lg px-3 py-2.5">
              <div className="w-4 h-4 rounded-full bg-[#F2AA00]/20 border border-[#F2AA00]/40 flex items-center justify-center text-[8px] text-[#F2AA00] flex-shrink-0 mt-0.5">
                ⏳
              </div>
              <p className="text-xs text-gray-400">
                Processing payment & slot confirmation...
              </p>
            </div>
          </div>

          {/* Reassurance message */}
          <p className="text-[11px] text-gray-600 tracking-widest uppercase">
            Do not close this page
          </p>
        </div>
      </div>
    );
  }

  // ── SUCCESS SCREEN ──
  if (submitted) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm w-full">
          {/* Green tick */}
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
            <FontAwesomeIcon icon={faCheck} className="text-green-400 text-2xl" />
          </div>
          <h2 className="text-xl tracking-wide">Registration Submitted!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {useRedeem
              ? <>Your entry fee was paid using <span className="text-[#F2AA00] font-mono ">{tournament?.fee} points</span>. Admin will confirm your slot for <span className="text-[#F2AA00]">{tournament?.name}</span>.</>
              : <>Your payment is under review. Admin will verify and confirm your slot for <span className="text-[#F2AA00]">{tournament?.name}</span>.</>
            }
          </p>
          {!useRedeem && (
            <p className="text-[10px] text-gray-700 tracking-widest uppercase">Txn ID: {txn}</p>
          )}

          {/* ── HIGHLIGHTED ANNOUNCEMENT ── */}
          <div className="mt-2 rounded-xl border border-[#F2AA00]/40 bg-[#F2AA00]/8 px-4 py-4 text-left space-y-2.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#F2AA00]/60 to-transparent" />
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon icon={faStar} className="text-[#F2AA00] text-xs" />
              <p className="text-[11px] text-[#F2AA00] tracking-[0.2em] uppercase ">What's Next?</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#F2AA00]/20 border border-[#F2AA00]/40 flex items-center justify-center text-[9px] text-[#F2AA00] flex-shrink-0 mt-0.5">1</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Visit <span className="text-white ">My Profile → My Matches</span> to check your registration status.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#F2AA00]/20 border border-[#F2AA00]/40 flex items-center justify-center text-[9px] text-[#F2AA00] flex-shrink-0 mt-0.5">2</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Once admin <span className="text-white">approves your payment</span>, your slot will be confirmed.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#F2AA00]/20 border border-[#F2AA00]/40 flex items-center justify-center text-[9px] text-[#F2AA00] flex-shrink-0 mt-0.5">3</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                The <span className="text-white">Room ID & Password</span> will appear in My Matches before the tournament starts.
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => router.push("/my-matches")}
              className="w-full flex items-center justify-center gap-2 bg-[#F2AA00] text-black py-3 rounded-xl text-sm tracking-widest  hover:bg-[#e09e00] transition-all"
            >
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              Check My Matches
            </button>
            <div className="flex gap-3">
              <button onClick={() => router.push("/tournaments")}
                className="flex-1 border border-[#F2AA00]/50 text-[#F2AA00] py-2.5 text-xs tracking-widest rounded-xl hover:bg-[#F2AA00] hover:text-black transition-all">
                Browse Tournaments
              </button>
              <button onClick={() => setSubmitted(false)}
                className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-xs tracking-widest rounded-xl hover:border-gray-700 hover:text-white transition-all">
                Register Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm tracking-widest uppercase animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen px-4 py-10 md:px-6 relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#F2AA00]/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-[#F2AA00]/4 blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* HEADER */}
        <div className={`mb-8 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <p className="text-[10px] tracking-[0.4em] text-[#F2AA00] uppercase mb-2">Registration</p>
          <h1 className="text-3xl sm:text-4xl tracking-wide">Tournament Registration</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── LEFT FORM ── */}
          <div
            className={`lg:col-span-2 space-y-5 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
            style={{ transitionDelay: "160ms" }}
          >
            {/* PREVIOUS TEAM QUICK-FILL */}
            {prevTeams.length > 0 && tournament.playerCount > 1 && (
              <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
                <SectionLabel>Quick Fill — Previous Teams</SectionLabel>
                <p className="text-xs text-gray-500 mb-3">Select a team you registered with before to auto-fill player details.</p>
                <div className="flex flex-wrap gap-2">
                  {prevTeams.map((t) => (
                    <button
                      key={t.team_name}
                      type="button"
                      onClick={() => applyPreviousTeam(t.team_name)}
                      className={`px-3 py-1.5 rounded-lg text-xs tracking-wide border transition-all ${
                        selectedTeam === t.team_name
                          ? "bg-[#F2AA00] text-black border-[#F2AA00] "
                          : "border-gray-700 text-gray-300 hover:border-[#F2AA00]/50 hover:text-white bg-black/40"
                      }`}
                    >
                      {t.team_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEAM NAME */}
            {tournament.playerCount > 1 && (
              <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
                <SectionLabel>Team Info</SectionLabel>
                <div className="relative">
                  <FontAwesomeIcon icon={faShield} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                  <input placeholder="Team Name" value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className={inputCls + " pl-9 text-[16px]"} />
                </div>
              </div>
            )}

            {/* PLAYERS */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
              <SectionLabel>
                {tournament.playerCount === 1
                  ? "Player Info"
                  : `Players — ${tournament.mode} (Captain required, others optional)`}
              </SectionLabel>
              <div className="space-y-3">
                <PlayerSlot index={1} isCaptain value={captain}
                  onChange={(f: "name"|"id", v: string) => setCaptain((c) => ({ ...c, [f]: v }))} />
                {players.map((p, idx) => (
                  <PlayerSlot key={idx} index={idx + 2} value={p}
                    onChange={(f: "name"|"id", v: string) => updatePlayer(idx, f, v)} />
                ))}
              </div>
              <div className="relative mt-4">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                <input type="email" placeholder="Contact Email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls + " pl-9"} />
              </div>
            </div>

            {/* PAYMENT */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
              <SectionLabel>Payment</SectionLabel>

              {/* Fee banner */}
              <div className="flex items-center justify-between bg-black border border-gray-800 rounded-xl px-4 py-3.5 mb-4">
                <div>
                  <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-0.5">Entry Fee</p>
                  <p className="text-sm text-gray-500">{tournament.name}</p>
                </div>
                <p className="text-2xl text-[#F2AA00] font-mono">₹{tournament.fee}</p>
              </div>

              {/* ── REDEEM POINTS OPTION ── */}
              <div className={`mb-4 rounded-xl border transition-all duration-200 overflow-hidden ${
                useRedeem
                  ? "border-[#F2AA00]/40 bg-[#F2AA00]/5"
                  : canRedeem
                  ? "border-[#F2AA00]/20 bg-black/40"
                  : "border-gray-800 bg-black/20"
              }`}>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <FontAwesomeIcon
                      icon={faCoins}
                      className={`text-sm flex-shrink-0 ${canRedeem ? "text-[#F2AA00]" : "text-gray-600"}`}
                    />
                    <div className="min-w-0">
                      <p className={`text-xs tracking-wide ${canRedeem ? "text-white" : "text-gray-500"}`}>
                        Pay with Points
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[14px] text-gray-500">
                          Balance:{" "}
                          {!pointsLoaded ? (
                            <span className="font-mono text-gray-600 animate-pulse">loading...</span>
                          ) : (
                            <span className={`font-mono ${canRedeem ? "text-[#F2AA00]" : "text-gray-400"}`}>
                              {userPoints} pts
                            </span>
                          )}
                        </span>
                        {canRedeem ? (
                          <span className="text-[14px] text-green-400 font-medium">
                            ✓ Enough to cover ₹{tournament.fee}
                          </span>
                        ) : (
                          <span className="text-[14px] text-red-400/80">
                            Need {Math.max(0, tournament.fee - userPoints)} more pts to use this
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle — always visible, disabled when can't redeem */}
                  <button
                    type="button"
                    disabled={!canRedeem}
                    onClick={() => canRedeem && setUseRedeem((v) => !v)}
                    title={canRedeem ? "Toggle redeem" : `Need ${tournament.fee} pts to redeem`}
                    className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ml-3 ${
                      !canRedeem
                        ? "bg-gray-800 cursor-not-allowed opacity-50"
                        : useRedeem
                        ? "bg-[#F2AA00] cursor-pointer"
                        : "bg-gray-700 cursor-pointer hover:bg-gray-600"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                      useRedeem ? "left-6" : "left-1"
                    }`} />
                  </button>
                </div>

                {/* Active redeem info */}
                {useRedeem && canRedeem && (
                  <div className="px-4 pb-3 border-t border-[#F2AA00]/20 pt-3 space-y-1.5">
                    <p className="text-[11px] text-[#F2AA00] leading-relaxed">
                      <FontAwesomeIcon icon={faCircleExclamation} className="mr-1.5" />
                      <strong>{tournament.fee} pts</strong> will be deducted from your wallet. No UPI payment needed.
                    </p>
                    {userPoints > tournament.fee && (
                      <p className="text-[10px] text-gray-500">
                        Only {tournament.fee} pts will be used — remaining {userPoints - tournament.fee} pts stay in your wallet.
                      </p>
                    )}
                  </div>
                )}

                {/* Rule note — only shown when disabled */}
                {!canRedeem && (
                  <div className="px-4 pb-3 border-t border-gray-800/50 pt-2">
                    <p className="text-[10px] text-gray-700">
                      You need at least <span className="text-gray-500 font-mono">{tournament.fee} pts</span> to pay with points. Partial redemption is not allowed.
                    </p>
                  </div>
                )}
              </div>

              {/* UPI Payment section — hidden when redeeming */}
              {!useRedeem && (
                <>
                  <div className="mb-5">
                    <PaymentBlock config={paymentConfig} fee={tournament.fee} />
                  </div>

                  {/* User's own UPI */}
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1.5">Your UPI ID</p>
                    <div className="relative">
                      <FontAwesomeIcon icon={faMobileScreen} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                      <input
                        placeholder="yourname@upi  (used for refund if needed)"
                        value={upi}
                        onChange={(e) => setUpi(e.target.value)}
                        className={inputCls + " pl-9 font-mono text-sm"}
                      />
                    </div>
                  </div>

                  {/* Screenshot */}
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1.5">Payment Screenshot</p>
                    <label className="block cursor-pointer">
                      <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 ${
                        screenshot
                          ? "border-green-500/40 bg-green-500/5"
                          : "border-gray-800 hover:border-[#F2AA00]/30 hover:bg-[#F2AA00]/[0.02]"
                      }`}>
                        {screenshot ? (
                          <div className="flex items-center justify-center gap-2 text-green-400">
                            <FontAwesomeIcon icon={faCheck} className="text-sm" />
                            <span className="text-xs tracking-wide">{screenshot.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FontAwesomeIcon icon={faCloudArrowUp} className="text-gray-600 text-xl" />
                            <p className="text-xs text-gray-500 tracking-wide">Upload payment screenshot</p>
                            <p className="text-[10px] text-gray-700">PNG, JPG — max 5 MB</p>
                          </div>
                        )}
                      </div>
                      <input type="file" className="hidden" accept="image/*"
                        onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1.5">Transaction ID</p>
                    <div className="relative">
                      <FontAwesomeIcon icon={faHashtag} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                      <input placeholder="e.g. T2503051234567890" value={txn}
                        onChange={(e) => setTxn(e.target.value)}
                        className={inputCls + " pl-9 font-mono text-sm"} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* SUBMIT */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              className={`w-full py-4 rounded-xl text-sm tracking-widest transition-all duration-200 ${
                isValid && !isLoading
                  ? "bg-[#F2AA00] text-black hover:bg-[#e09e00] hover:shadow-xl hover:shadow-[#F2AA00]/20 active:scale-[0.98]"
                  : "bg-[#0b0b0b] text-gray-600 border border-gray-800 cursor-not-allowed"
              }`}
            >
              {isLoading
                ? "Processing..."
                : isValid
                ? useRedeem
                  ? `Register & Redeem ${tournament.fee} Points`
                  : "Submit Registration"
                : "Complete all fields to register"}
            </button>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div
            className={`space-y-5 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}
            style={{ transitionDelay: "240ms" }}
          >
            {/* Tournament card */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors duration-200">
              <div className="relative h-32 overflow-hidden">
                <Image src={tournament.mapImage} alt={tournament.map} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <p className="text-[10px] text-gray-400 tracking-widest uppercase">{tournament.map}</p>
                  <p className="text-white text-sm tracking-wide mt-0.5">{tournament.name}</p>
                </div>
                <div className="absolute top-3 right-3 bg-black/60 border border-[#F2AA00]/30 text-[#F2AA00] text-[10px] px-2 py-0.5 rounded-md tracking-widest">
                  {tournament.platform}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: "Mode",      val: `${tournament.mode} · ${tournament.playerCount} Players` },
                  { label: "Date",      val: `${tournament.date} · ${tournament.time}` },
                  { label: "Entry Fee", val: `₹${tournament.fee}` },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600">{r.label}</span>
                    <span className={r.label === "Entry Fee" ? "text-[#F2AA00] font-mono" : "text-gray-300"}>
                      {r.val}
                    </span>
                  </div>
                ))}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
                    <span>Slots</span>
                    <span>{tournament.filled}/{tournament.slots} · {slotsLeft} left</span>
                  </div>
                  <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${slotPercent >= 90 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                      style={{ width: `${slotPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ UPDATED: Points Table now uses pointsConfig */}
            <PointsTable mode={tournament.mode?.toLowerCase() ?? "team"} pointsConfig={pointsConfig} />

            {/* Map pool */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-4">
              <SectionLabel>Map Pool</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {ALL_MAPS.map((map) => {
                  const isSelected = map.name === tournament.map;
                  return (
                    <div key={map.name} className={`relative rounded-lg overflow-hidden border transition-all duration-300 ${
                      isSelected ? "border-[#F2AA00] shadow-md shadow-[#F2AA00]/20" : "border-gray-800 opacity-50"
                    }`}>
                      <Image src={map.src} alt={map.name} width={200} height={120} className="w-full h-20 object-cover" />
                      <div className={`absolute inset-0 ${isSelected ? "bg-black/20" : "bg-black/50"}`} />
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 py-1 px-2">
                        <span className="text-[10px] text-white tracking-wide">{map.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}