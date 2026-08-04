import { getDb } from "./db";

export interface ApiUser {
  id: string;
  username: string;
  name: string;
  role: string;
  bio: string;
  emoji: string;
  gradient: string;
  avatarUrl?: string;
  verified: boolean;
  followers: number;
  following: number;
  isFollowing?: boolean;
}

export interface ApiComment {
  id: string;
  user: ApiUser;
  text: string;
  createdAt: string;
}

export interface ApiPost {
  id: string;
  user: ApiUser;
  type: "article" | "video" | "image";
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  coverEmoji?: string;
  coverGradient?: string;
  videoUrl?: string;
  mediaUrl?: string;
  duration?: string;
  views: number;
  caption?: string;
  location?: string;
  likes: number;
  liked: boolean;
  saved: boolean;
  likesHidden?: boolean;
  commentsDisabled?: boolean;
  musicId?: string | null;
  comments: ApiComment[];
  createdAt: string;
}

export interface ApiStory {
  id: string;
  user: ApiUser;
  emoji: string;
  gradient: string;
  caption?: string;
  mediaUrl?: string;
  musicId?: string | null;
  texts?: { id: string; text: string; x: number; y: number; size: number; color: string }[];
  viewed: boolean;
  createdAt: string;
}

const GRADIENTS = [
  "from-amber-400 to-orange-600",
  "from-lime-400 to-green-700",
  "from-teal-400 to-cyan-700",
  "from-sky-400 to-blue-700",
  "from-emerald-500 to-teal-800",
  "from-orange-400 to-red-700",
  "from-yellow-400 to-amber-700",
];

const EMOJIS = ["🌿", "🌾", "🌻", "🌳", "🪱", "📡", "💧", "🧑‍🔬", "🗺️", "🐝"];

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

export async function apiUserFromRow(u: any, viewerId?: string): Promise<ApiUser> {
  const d = await getDb();
  const followers = await d.prepare("SELECT COUNT(*) as c FROM follows WHERE following_id = ?").get(u.id);
  const following = await d.prepare("SELECT COUNT(*) as c FROM follows WHERE follower_id = ?").get(u.id);
  return {
    id: u.id,
    username: (u.username || u.name.toLowerCase().replace(/\s+/g, ".")),
    name: u.name,
    role: u.account_type,
    bio: u.bio || "",
    emoji: u.emoji || pick(EMOJIS, u.id),
    gradient: u.gradient || pick(GRADIENTS, u.id),
    avatarUrl: u.avatar_media || undefined,
    verified: !!u.verified,
    followers: Number((followers as any)?.c || 0),
    following: Number((following as any)?.c || 0),
  };
}


export async function serializePost(row: any, viewerId?: string): Promise<ApiPost> {
  const d = await getDb();
  const userRow = await d.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id);
  const user = userRow ? await apiUserFromRow(userRow, viewerId) : null;

  const likes = await d.prepare("SELECT COUNT(*) as c FROM post_likes WHERE post_id = ?").get(row.id);
  const likedRow = viewerId ? await d.prepare("SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?").get(row.id, viewerId) : undefined;

  const commentRows = await d.prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC").all(row.id);
  const comments: ApiComment[] = [];
  for (const c of commentRows as any[]) {
    const cu = await d.prepare("SELECT * FROM users WHERE id = ?").get(c.user_id);
    if (cu) comments.push({ id: c.id, user: await apiUserFromRow(cu), text: c.text, createdAt: c.created_at });
  }

  return {
    id: row.id,
    user: user!,
    type: row.type,
    title: row.title || undefined,
    excerpt: row.excerpt || undefined,
    content: row.content || undefined,
    tags: row.tags ? (row.tags as string).split(",").filter(Boolean) : undefined,
    coverEmoji: row.cover_emoji || undefined,
    coverGradient: row.cover_gradient || undefined,
    videoUrl: row.video_url || undefined,
    mediaUrl: row.media_url || undefined,
    duration: row.duration || undefined,
    views: Number(row.views || 0),
    caption: row.caption || undefined,
    location: row.location || undefined,
    likes: Number(likes?.c || 0),
    liked: !!likedRow,
    saved: false,
    likesHidden: !!row.likes_hidden,
    commentsDisabled: !!row.comments_disabled,
    musicId: row.music_id || null,
    comments,
    createdAt: row.created_at,
  };
}

export async function serializeStory(row: any, viewerId?: string): Promise<ApiStory> {
  const d = await getDb();
  const userRow = await d.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id);
  const viewed = viewerId ? await d.prepare("SELECT 1 FROM story_views WHERE story_id = ? AND user_id = ?").get(row.id, viewerId) : undefined;
  let texts: ApiStory["texts"];
  try { texts = row.texts ? JSON.parse(row.texts) : undefined; } catch { texts = undefined; }
  return {
    id: row.id,
    user: userRow ? await apiUserFromRow(userRow) : ({} as ApiUser),
    emoji: row.emoji || "🌿",
    gradient: row.gradient || "from-amber-400 to-orange-600",
    caption: row.caption || undefined,
    mediaUrl: row.media_url || undefined,
    musicId: row.music_id || null,
    texts,
    viewed: !!viewed,
    createdAt: row.created_at,
  };
}

export function genId(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
