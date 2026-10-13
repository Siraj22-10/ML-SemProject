/* ─────────────────────────────────────────────────────────────────────────────
 * TabContext.jsx — Global multi-tab state (Home + video watch + search tabs).
 *
 * Uses useReducer for atomic tab+activeId mutations (avoids race conditions
 * between separate useState calls).
 * ────────────────────────────────────────────────────────────────────────── */
import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

const TabContext = createContext(null);

// The Home tab is always present and cannot be closed.
const HOME_TAB = { id: 'home', type: 'home', title: 'Home', permanent: true };

const initialState = {
  tabs: [HOME_TAB],
  activeTabId: 'home',
};

function tabReducer(state, action) {
  switch (action.type) {
    // ── Add a video or search tab ────────────────────────────────────────
    case 'ADD_TAB': {
      const { tab } = action;

      // De-duplicate video tabs by YouTube videoId
      if (tab.type === 'video' && tab.videoId) {
        const existing = state.tabs.find(
          (t) => t.type === 'video' && t.videoId === tab.videoId,
        );
        if (existing) return { ...state, activeTabId: existing.id };
      }

      // De-duplicate search tabs by query (case-insensitive)
      if (tab.type === 'search' && tab.query) {
        const existing = state.tabs.find(
          (t) =>
            t.type === 'search' &&
            t.query.toLowerCase() === tab.query.toLowerCase(),
        );
        if (existing) return { ...state, activeTabId: existing.id };
      }

      const tabId = tab.id || `${tab.type}-${Date.now()}`;
      return {
        tabs: [...state.tabs, { ...tab, id: tabId }],
        activeTabId: tabId,
      };
    }

    // ── Remove a tab (cannot remove Home) ────────────────────────────────
    case 'REMOVE_TAB': {
      if (action.tabId === 'home') return state;
      const filtered = state.tabs.filter((t) => t.id !== action.tabId);
      return {
        tabs: filtered,
        activeTabId:
          state.activeTabId === action.tabId ? 'home' : state.activeTabId,
      };
    }

    // ── Switch active tab ────────────────────────────────────────────────
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.tabId };

    default:
      return state;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function TabProvider({ children }) {
  const [state, dispatch] = useReducer(tabReducer, initialState);

  const addTab = useCallback(
    (tab) => dispatch({ type: 'ADD_TAB', tab }),
    [],
  );
  const removeTab = useCallback(
    (tabId) => dispatch({ type: 'REMOVE_TAB', tabId }),
    [],
  );
  const setActiveTab = useCallback(
    (tabId) => dispatch({ type: 'SET_ACTIVE_TAB', tabId }),
    [],
  );

  const activeTab = useMemo(
    () => state.tabs.find((t) => t.id === state.activeTabId) || HOME_TAB,
    [state.tabs, state.activeTabId],
  );

  const value = useMemo(
    () => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      activeTab,
      addTab,
      removeTab,
      setActiveTab,
    }),
    [state.tabs, state.activeTabId, activeTab, addTab, removeTab, setActiveTab],
  );

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTabs() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTabs must be used within <TabProvider>');
  return ctx;
}
