export interface ClubSettings {
  joinPolicy?: 'open' | 'invite_only' | 'approval';
  visibility?: 'public' | 'private';
  enableCall?: boolean;
}

export function parseClubSettings(raw: string): ClubSettings {
  try {
    return JSON.parse(raw) as ClubSettings;
  } catch {
    return {};
  }
}

/** Calls are enabled unless explicitly disabled in club settings. */
export function isCallEnabled(settings: ClubSettings): boolean {
  return settings.enableCall !== false;
}
