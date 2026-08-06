const KEY = "lailtak_my_invites";

export interface SavedInvite {
  manageToken: string;
  title: string;
  eventDate: string;
  savedAt: number;
}

export function getSavedInvites(): SavedInvite[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(
      (i): i is SavedInvite => !!i && typeof i.manageToken === "string" && i.manageToken.length > 0
    );
  } catch {
    return [];
  }
}

export function saveInvite(invite: Omit<SavedInvite, "savedAt">): void {
  try {
    const list = getSavedInvites().filter((i) => i.manageToken !== invite.manageToken);
    list.unshift({ ...invite, savedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    // localStorage unavailable (private mode) — ignore
  }
}

export function removeInvite(manageToken: string): void {
  try {
    const list = getSavedInvites().filter((i) => i.manageToken !== manageToken);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
