/* ─────────────────────────────────────────────────────────────────────────────
 * ModelSelector.jsx — Top navbar dropdown to switch recommendation models.
 * ────────────────────────────────────────────────────────────────────────── */
import React from 'react';
import { Cpu, Zap, Brain, Radio } from 'lucide-react';

export const MODEL_OPTIONS = [
  { id: 'm3', name: 'Model 3: Dense LSA (Best)', icon: Brain, badge: 'SVD Hybrid', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'm2', name: 'Model 2: XGBoost Ranker', icon: Zap, badge: 'Ensemble', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'm1', name: 'Model 1: TF-IDF + KNN', icon: Cpu, badge: 'Baseline', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'live', name: 'YouTube Live API', icon: Radio, badge: 'Real-Time', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
];

export default function ModelSelector({ activeModel, onModelChange, onOpenBenchmarks }) {
  const selected = MODEL_OPTIONS.find((m) => m.id === activeModel) || MODEL_OPTIONS[0];
  const Icon = selected.icon;

  return (
    <div className="flex items-center gap-2">
      {/* Model Selection Dropdown */}
      <div className="relative group">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all duration-200 backdrop-blur-md ${selected.color}`}>
          <Icon className="w-3.5 h-3.5 animate-pulse" />
          <select
            value={activeModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-zinc-900 text-zinc-200">
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Model Comparison / Benchmark Drawer Trigger Button */}
      <button
        onClick={onOpenBenchmarks}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all duration-200 shadow-sm"
        title="View Comparative Benchmark Metrics (Precision, Recall, NDCG, Latency)"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Compare Models</span>
      </button>
    </div>
  );
}
