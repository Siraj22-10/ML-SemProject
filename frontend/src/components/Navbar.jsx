/* ─────────────────────────────────────────────────────────────────────────────
 * Navbar.jsx — Fixed top navigation bar (YouTube Dark style).
 *
 *   Left   : YouTube-proportioned red play emblem + bold "FeedForYou" logo
 *   Center : Pill search bar + mic icon
 *   Right  : ModelSelector & Benchmark Drawer trigger
 * ────────────────────────────────────────────────────────────────────────── */
import { useState } from 'react';
import { Search, Mic } from 'lucide-react';
import { useTabs } from '../context/TabContext';
import ModelSelector from './ModelSelector';

function YTPlayIcon() {
  return (
    <svg viewBox="0 0 28 20" className="w-7 h-5" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="20" rx="6" fill="#FF0000" />
      <polygon points="11,4.5 11,15.5 21,10" fill="white" />
    </svg>
  );
}

export default function Navbar({ activeModel, onModelChange, onOpenBenchmarks }) {
  const [query, setQuery] = useState('');
  const { addTab } = useTabs();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    addTab({ type: 'search', title: `Search: ${q}`, query: q });
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#0f0f0f] border-b border-white/5 shrink-0 gap-2">
      {/* ── Left: Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 select-none shrink-0">
        <YTPlayIcon />
        <span className="text-lg font-bold tracking-tighter text-yt-text ml-0.5 hidden sm:inline">
          FeedFor<span className="text-yt-red">You</span>
        </span>
      </div>

      {/* ── Center: Search ──────────────────────────────────────────────── */}
      <form
        onSubmit={handleSearch}
        className="flex items-center w-full max-w-[480px] mx-2"
      >
        <div className="flex flex-1 items-center h-10 rounded-full border border-[#303030] bg-[#121212] overflow-hidden focus-within:border-[#1c62b9]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 h-full px-4 bg-transparent text-sm text-yt-text placeholder-yt-muted outline-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center w-14 h-full bg-[#222222] border-l border-[#303030] hover:bg-[#333333] transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-yt-text" />
          </button>
        </div>
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 ml-2 rounded-full bg-[#222222] hover:bg-[#333333] transition-colors shrink-0"
          aria-label="Search with voice"
        >
          <Mic className="w-4 h-4 text-yt-text" />
        </button>
      </form>

      {/* ── Right: Model Selector & Benchmarks Drawer ────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <ModelSelector
          activeModel={activeModel}
          onModelChange={onModelChange}
          onOpenBenchmarks={onOpenBenchmarks}
        />
      </div>
    </header>
  );
}
