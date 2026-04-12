"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type AppUser, USERS, getCurrentUser, setCurrentUser as setCurrentUserStorage, logout as logoutStorage, getUserKey as getUserKeyFn } from "./auth";

interface UserContextType {
  user: AppUser | null;
  loading: boolean;
  login: (userId: string) => void;
  logout: () => void;
  getUserKey: (key: string) => string;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  getUserKey: (key: string) => key,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  const login = useCallback((userId: string) => {
    setCurrentUserStorage(userId);
    const u = USERS.find((u) => u.id === userId) || null;
    setUser(u);

    // Initialize Amelie with HSK level 4 on first login
    if (userId === "amelie") {
      const statsKey = `amelie_user_stats`;
      const existing = localStorage.getItem(statsKey);
      if (!existing) {
        localStorage.setItem(
          statsKey,
          JSON.stringify({
            words_mastered: 0,
            daily_streak: 0,
            xp_total: 0,
            xp_today: 0,
            current_hsk_level: 4,
            words_in_progress: 0,
            words_to_review: 0,
          })
        );
      }
    }
  }, []);

  const logout = useCallback(() => {
    logoutStorage();
    setUser(null);
  }, []);

  const getUserKey = useCallback(
    (key: string): string => {
      if (!user) return key;
      return `${user.id}_${key}`;
    },
    [user]
  );

  return (
    <UserContext.Provider value={{ user, loading, login, logout, getUserKey }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export { UserContext };
