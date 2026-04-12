export interface AppUser {
  id: string;
  name: string;
  displayName: string;
  hskUnlocked: number;
}

export const USERS: AppUser[] = [
  { id: "clem", name: "clem", displayName: "Clem", hskUnlocked: 4 },
  { id: "amelie", name: "amelie", displayName: "Amélie", hskUnlocked: 4 },
];

const CURRENT_USER_KEY = "current_user";

export function getCurrentUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    if (userId === "admin") return null;
    return USERS.find((u) => u.id === userId) || null;
  } catch {
    return null;
  }
}

export function setCurrentUser(userId: string): void {
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CURRENT_USER_KEY) === "admin";
}

/**
 * Returns a user-specific localStorage key by prefixing with the current user id.
 * e.g., getUserKey("srs_progress") => "clem_srs_progress"
 */
export function getUserKey(key: string): string {
  const user = getCurrentUser();
  if (!user) return key;
  return `${user.id}_${key}`;
}
