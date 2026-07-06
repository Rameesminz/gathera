export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PublicUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  email_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  settings: string;
  status: 'active' | 'suspended' | 'archived';
  created_at: string;
  updated_at: string;
}

export type RoleName = 'admin' | 'moderator' | 'member';

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role_id: string;
  role_name: RoleName;
  status: string;
  joined_at: string;
}

export interface ClubMember {
  id: string;
  user_id: string;
  status: string;
  role_name: RoleName;
  display_name: string;
  email: string;
  joined_at: string;
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  created_by: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  metadata: string;
  created_at: string;
  updated_at: string;
  attendees?: Array<{ user_id: string; status: string; display_name: string }>;
}

export interface Poll {
  id: string;
  clubId: string;
  chatId: string | null;
  createdBy: string;
  question: string;
  options: string[];
  multipleChoice: boolean;
  anonymous: boolean;
  closesAt: string | null;
  createdAt: string;
  voteCounts: number[];
  userVotes: number[];
  totalVotes: number;
}

export interface Chat {
  id: string;
  club_id: string | null;
  type: 'group' | 'direct';
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  metadata: string;
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: string;
  read: number;
  created_at: string;
}

export interface Gallery {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  cover_file_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  gallery_id: string;
  file_id: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
  filename: string;
  r2_key: string;
  mime_type: string | null;
}

export interface ClubFile {
  id: string;
  club_id: string;
  uploader_id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  r2_key: string;
  created_at: string;
}

export interface Tournament {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  format: string;
  status: string;
  max_teams: number | null;
  start_at: string | null;
  created_at: string;
}
