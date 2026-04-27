// Persistent stats — zustand + localStorage. Safe to call from anywhere;
// writes are debounced by zustand's persist middleware and localStorage
// failures (private mode, disabled) fall back silently to in-memory only.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const SCHEMA_VERSION = 1;

function h2hKey(aAgent, bAgent) {
  return `${aAgent}_vs_${bAgent}`;
}

function freshHeadToHead() {
  return {};
}

export const useStats = create(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      matches: [],
      headToHead: freshHeadToHead(),

      recordMatch(record) {
        const { leftAgent, rightAgent, winner } = record;
        const winnerAgent = winner === 'left' ? leftAgent : rightAgent;
        const loserAgent  = winner === 'left' ? rightAgent : leftAgent;

        // Normalized so head-to-head between the same two agents always lives
        // under a single sorted-pair key.
        const [a, b] = [leftAgent, rightAgent].slice().sort();
        const key = h2hKey(a, b);
        const prev = get().headToHead[key] ?? { winsByAgent: {}, lastMeeting: null, totalMatches: 0 };
        const wins = { ...prev.winsByAgent };
        wins[winnerAgent] = (wins[winnerAgent] ?? 0) + 1;
        if (!(loserAgent in wins)) wins[loserAgent] = 0;

        const nextRecord = {
          id: record.id ?? crypto.randomUUID(),
          playedAt: new Date().toISOString(),
          ...record
        };

        set({
          matches: [...get().matches, nextRecord].slice(-60),
          headToHead: {
            ...get().headToHead,
            [key]: {
              winsByAgent: wins,
              lastMeeting: nextRecord.playedAt,
              totalMatches: (prev.totalMatches ?? 0) + 1
            }
          }
        });
      },

      headToHeadFor(aAgent, bAgent) {
        const [a, b] = [aAgent, bAgent].slice().sort();
        return get().headToHead[h2hKey(a, b)] ?? null;
      },

      recentMatches(limit = 10) {
        const { matches } = get();
        return matches.slice(-limit).reverse();
      },

      clearAll() {
        set({ matches: [], headToHead: freshHeadToHead() });
      }
    }),
    {
      name: 'neuropong-stats-v1',
      storage: createJSONStorage(() => {
        try {
          // Probe localStorage. If it throws (private mode / disabled), fall
          // back to an in-memory shim so the app still runs.
          localStorage.setItem('__np_probe__', '1');
          localStorage.removeItem('__np_probe__');
          return localStorage;
        } catch {
          const mem = new Map();
          return {
            getItem: (k) => mem.get(k) ?? null,
            setItem: (k, v) => void mem.set(k, v),
            removeItem: (k) => void mem.delete(k)
          };
        }
      }),
      partialize: (s) => ({
        schemaVersion: s.schemaVersion,
        matches: s.matches,
        headToHead: s.headToHead
      })
    }
  )
);
