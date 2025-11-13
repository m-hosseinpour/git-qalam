export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface ConflictResolution {
  note_id: string;
  resolution_type: 'keep_mine' | 'use_theirs' | 'merge';
  content?: string;
}