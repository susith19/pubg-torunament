// app/admin/points-config/page.tsx
"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faRotateLeft,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";

interface Config {
  placement: Record<string, Record<string, number>>;
  kill_points: number;
  updated_at?: string;
}

export default function PointsConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [original, setOriginal] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "", show: false });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/points-config");
      const data = await res.json();
      if (data.success) {
        setConfig(data);
        setOriginal(data);
      }
    } catch (error) {
      showToast("Failed to load config", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: string = "success") => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast({ msg: "", type: "", show: false }), 2500);
  };

  const handlePlacementChange = (
    mode: string,
    position: string,
    value: number,
  ) => {
    if (!config) return;
    setConfig({
      ...config,
      placement: {
        ...config.placement,
        [mode]: {
          ...config.placement[mode],
          [position]: value,
        },
      },
    });
  };

  const handleKillPointsChange = (value: number) => {
    if (!config) return;
    setConfig({
      ...config,
      kill_points: Math.max(0, value),
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/points-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement: config.placement,
          kill_points: config.kill_points,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Update original with the response (includes updated_at)
        const updatedConfig = {
          ...config,
          updated_at: data.updated_at || new Date().toISOString(),
        };
        setOriginal(updatedConfig);
        setConfig(updatedConfig);
        showToast("✓ Config saved successfully!", "success");
      } else {
        showToast(data.error || "Failed to save", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Error saving config", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (original) {
      setConfig(JSON.parse(JSON.stringify(original)));
      showToast("Changes discarded", "info");
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Reset all to factory defaults?")) return;

    const defaults: Config = {
      placement: {
        solo: {
          "1": 500,
          "2": 400,
          "3": 300,
          "4": 200,
          "5": 100,
          "6-10": 75,
          "11-15": 50,
          "16-20": 30,
        },
        duo: {
          "1": 500,
          "2": 400,
          "3": 300,
          "4": 200,
          "5-10": 100,
          "11-15": 50,
        },
        team: {
          "1": 500,
          "2": 400,
          "3": 300,
          "4": 200,
          "5": 180,
          "6-10": 75,
        },
      },
      kill_points: 5,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/admin/points-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults),
      });

      const data = await res.json();
      if (data.success) {
        const updatedConfig = {
          ...defaults,
          updated_at: data.updated_at || new Date().toISOString(),
        };
        setConfig(updatedConfig);
        setOriginal(updatedConfig);
        showToast("✓ Reset to defaults!", "success");
      }
    } catch (error) {
      console.error("Reset error:", error);
      showToast("Error resetting", "error");
    } finally {
      setSaving(false);
    }
  };

  // Check if placement or kill_points changed (ignore updated_at)
  const isDirty =
    config && original
      ? JSON.stringify({
          placement: config.placement,
          kill_points: config.kill_points,
        }) !==
        JSON.stringify({
          placement: original.placement,
          kill_points: original.kill_points,
        })
      : false;

  if (loading) {
    return (
      <div className="bg-black min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900 rounded-xl h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="bg-black min-h-screen text-white p-6">
      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-md tracking-widests transition-all ${
          toast.show
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6 pointer-events-none"
        } ${
          toast.type === "success"
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : toast.type === "error"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
        }`}
      >
        {toast.msg}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl   tracking-widests">
              Points Configuration
            </h1>
            <p className="text-gray-600 text-md mt-1">
              Manage placement bonuses and kill rewards
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-600">
            <span>
              Last updated:{" "}
              {config.updated_at
                ? new Date(config.updated_at).toLocaleString()
                : "—"}
            </span>
          </div>
        </div>

        {/* Kill Points Section */}
        <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faCoins} className="text-[#F2AA00]" />
            </div>
            <div>
              <h2 className="text-lg   tracking-wide">Kill Points</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Points awarded per elimination
              </p>
            </div>
          </div>

          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2 tracking-widests uppercase">
                  Points per Kill
                </label>
                <input
                  type="number"
                  value={config.kill_points}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  onChange={(e) =>
                    handleKillPointsChange(parseInt(e.target.value || "0", 10))
                  }
                  min={0}
                  max={100}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-4 py-3 text-2xl font-mono text-[#F2AA00] outline-none transition-colors"
                />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-600 tracking-widests uppercase mb-2">
                  Preview
                </p>
                <p className="text-3xl font-mono text-[#F2AA00]">
                  {config.kill_points}
                </p>
                <p className="text-xs text-gray-500 mt-1">points per kill</p>
              </div>
            </div>
          </div>
        </div>

        {/* Placement Points Sections */}
        {["solo", "duo", "team"].map((mode) => (
          <div
            key={mode}
            className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-6"
          >
            <h2 className="text-lg   tracking-wide mb-5 capitalize">
              {mode === "solo" ? "Solo" : mode === "duo" ? "Duo" : "Squad"} Mode
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(config.placement[mode] || {}).map(
                ([position, points]) => (
                  <div
                    key={position}
                    className="bg-black border border-gray-800 rounded-lg p-4 hover:border-[#F2AA00]/20 transition-colors"
                  >
                    <label className="block text-xs text-gray-500 tracking-widests uppercase mb-2">
                      Position {position}
                    </label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) =>
                        handlePlacementChange(
                          mode,
                          position,
                          Number(e.target.value),
                        )
                      }
                      min={0}
                      max={9999}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-3 py-2 text-xl font-mono text-[#F2AA00] outline-none transition-colors"
                    />
                    <p className="text-[9px] text-gray-600 mt-2 tracking-widests">
                      {points} points
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-md tracking-widests   transition-all ${
              isDirty && !saving
                ? "bg-[#F2AA00] text-black hover:bg-[#e09e00] active:scale-95"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            <FontAwesomeIcon icon={faSave} />
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={handleReset}
            disabled={!isDirty || saving}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-md tracking-widests   border transition-all ${
              isDirty && !saving
                ? "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
                : "border-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            <FontAwesomeIcon icon={faRotateLeft} />
            Discard Changes
          </button>

          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="flex-1 py-3 rounded-lg text-md tracking-widests   border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-400 leading-relaxed">
            💡 Changes are applied immediately. All new award points will use
            these updated values.
          </p>
        </div>
      </div>
    </div>
  );
}
