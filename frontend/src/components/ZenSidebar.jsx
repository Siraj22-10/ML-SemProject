/* ─────────────────────────────────────────────────────────────────────────────
 * ZenSidebar.jsx — Zen-Browser-inspired floating left dock.
 *
 * • Collapses to 60 px icon strip; expands to 240 px on hover or pin-toggle.
 * • Frosted-glass backdrop (glass-dock utility in index.css).
 * • Contains: search, Home tab, open video/search tabs, "+ New Tab" button.
 * ────────────────────────────────────────────────────────────────────────── */
import { useState } from 'react';
import {
  Search,
  Home,
  X,
  Plus,
  Pin,
  PinOff,
  Globe,
} from 'lucide-react';
import { useTabs } from '../context/TabContext';

export default function ZenSidebar() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabs();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dockQuery, setDockQuery] = useState('');

  const expanded = pinned || hovered;

  /* ── Sidebar search handler ───────────────────────────────────────────── */
  const handleDockSearch = (e) => {
    e.preventDefault();
    const q = dockQuery.trim();
    if (!q) return;
    addTab({ type: 'search', title: `Search: ${q}`, query: q });
    setDockQuery('');
  };

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        fixed top-0 left-0 bottom-0 z-40
        glass-dock sidebar-transition flex flex-col
        ${expanded ? 'w-[240px]' : 'w-[60px]'}
      `}
    >
      {/* ── Pin / Unpin toggle ─────────────────────────────────────────── */}
      <div className="flex items-center justify-end h-14 px-2 shrink-0">
        {expanded && (
          <button
            onClick={() => setPinned((p) => !p)}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            {pinned ? (
              <PinOff className="w-4 h-4 text-yt-muted" />
            ) : (
              <Pin className="w-4 h-4 text-yt-muted" />
            )}
          </button>
        )}
      </div>

      {/* ── Dock Search ────────────────────────────────────────────────── */}
      <div className="px-2 mb-3 shrink-0">
        {expanded ? (
          <form onSubmit={handleDockSearch}>
            <div className="flex items-center h-8 rounded-md bg-white/5 border border-white/10 px-2 focus-within:border-[#1c62b9] transition-colors">
              <Search className="w-3.5 h-3.5 text-yt-muted mr-2 shrink-0" />
              <input
                value={dockQuery}
                onChange={(e) => setDockQuery(e.target.value)}
                placeholder="Search or enter URL…"
                className="flex-1 bg-transparent text-xs text-yt-text placeholder-yt-muted outline-none"
              />
            </div>
          </form>
        ) : (
          <button
            className="flex items-center justify-center w-full h-8 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => {
              setPinned(true);
              setHovered(true);
            }}
            title="Search"
          >
            <Search className="w-4 h-4 text-yt-muted" />
          </button>
        )}
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="mx-2 border-t border-white/10 mb-2 shrink-0" />

      {/* ── Tab list (scrollable) ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide px-1 space-y-0.5">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group relative flex items-center gap-2 w-full rounded-lg
                transition-colors text-left
                ${expanded ? 'px-2 py-2' : 'justify-center px-0 py-2'}
                ${isActive ? 'bg-white/10 text-white' : 'text-yt-muted hover:bg-white/5 hover:text-yt-text'}
              `}
              title={tab.title}
            >
              {/* Icon / thumbnail */}
              {tab.type === 'home' && (
                <Home
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-yt-muted'}`}
                />
              )}
              {tab.type === 'video' && (
                <img
                  src={tab.thumbnail}
                  alt=""
                  className="w-7 h-5 rounded-[3px] object-cover shrink-0 bg-yt-card"
                />
              )}
              {tab.type === 'search' && (
                <Globe
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-yt-muted'}`}
                />
              )}

              {/* Label (only when expanded) */}
              {expanded && (
                <span className="flex-1 text-xs line-clamp-1 leading-tight">
                  {tab.title}
                </span>
              )}

              {/* Close button (not for Home) */}
              {expanded && !tab.permanent && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      removeTab(tab.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20 transition-opacity shrink-0"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── + New Tab ──────────────────────────────────────────────────── */}
      <div className="p-2 shrink-0">
        <button
          onClick={() => setActiveTab('home')}
          className={`
            flex items-center gap-2 w-full rounded-lg
            transition-colors text-yt-muted hover:text-yt-text hover:bg-white/5
            ${expanded ? 'px-2 py-2' : 'justify-center py-2'}
          `}
          title="New Tab"
        >
          <Plus className="w-5 h-5 shrink-0" />
          {expanded && <span className="text-xs">New Tab</span>}
        </button>
      </div>
    </aside>
  );
}
