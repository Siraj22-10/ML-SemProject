/* ─────────────────────────────────────────────────────────────────────────────
 * TopicChips.jsx — Horizontally scrollable topic pill bar (YouTube-style)
 * with a toggle button to collapse/expand the entire chip bar.
 *
 * Active chip : white bg / black text
 * Inactive    : #272727 bg / white text
 * ────────────────────────────────────────────────────────────────────────── */
import { useRef, useState } from 'react';
import { ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { TOPICS } from '../data/videos';

export default function TopicChips({ activeTopic, onTopicChange }) {
  const scrollRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  const scroll = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="shrink-0">
      <div className="flex items-center px-1">
        {/* ── Toggle button ──────────────────────────────────────────── */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#272727] transition-colors shrink-0 mr-1"
          aria-label={collapsed ? 'Show topic filters' : 'Hide topic filters'}
          title={collapsed ? 'Show topics' : 'Hide topics'}
        >
          {collapsed ? (
            <ChevronDown className="w-5 h-5 text-yt-text" />
          ) : (
            <ChevronUp className="w-5 h-5 text-yt-text" />
          )}
        </button>

        {/* ── Collapsible chip area ──────────────────────────────────── */}
        <div
          className={`
            relative flex-1 overflow-hidden transition-all duration-300 ease-in-out
            ${collapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-16 opacity-100 py-3'}
          `}
        >
          {/* Scrollable chips */}
          <div
            ref={scrollRef}
            className="flex items-center gap-3 overflow-x-auto scrollbar-hide pr-10"
          >
            {TOPICS.map((topic) => {
              const isActive = activeTopic === topic;
              return (
                <button
                  key={topic}
                  onClick={() => onTopicChange(topic)}
                  className={`
                    whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-colors select-none shrink-0
                    ${
                      isActive
                        ? 'bg-white text-black'
                        : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'
                    }
                  `}
                >
                  {topic}
                </button>
              );
            })}
          </div>

          {/* Right scroll arrow */}
          <button
            onClick={scroll}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-[#0f0f0f]/80 hover:bg-[#272727] transition-colors hidden md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-yt-text" />
          </button>
        </div>
      </div>
    </div>
  );
}
