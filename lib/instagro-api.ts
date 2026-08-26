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
  musicUrl?: string | null;
  musicName?: string | null;
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
  musicUrl?: string | null;
  musicName?: string | null;
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

interface UserRow {
  id: string;
  username?: string | null;
  name: string;
  account_type: string;
  bio?: string | null;
  emoji?: string | null;
  gradient?: string | null;
  avatar_media?: string | null;
  verified?: number | boolean | null;
}

interface PostRow {
  id: string;
  user_id: string;
  type: ApiPost["type"];
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  tags?: string | null;
  cover_emoji?: string | null;
  cover_gradient?: string | null;
  video_url?: string | null;
  media_url?: string | null;
  duration?: string | null;
  views?: number | null;
  caption?: string | null;
  location?: string | null;
  likes_hidden?: number | boolean | null;
  comments_disabled?: number | boolean | null;
  music_id?: string | null;
  music_url?: string | null;
  music_name?: string | null;
  created_at: string;
}

interface CommentRow {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

interface StoryRow {
  id: string;
  user_id: string;
  emoji?: string | null;
  gradient?: string | null;
  caption?: string | null;
  media_url?: string | null;
  music_id?: string | null;
  music_url?: string | null;
  music_name?: string | null;
  texts?: string | null;
  created_at: string;
}

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

export async function apiUserFromRow(u: UserRow, viewerId?: string): Promise<ApiUser> {
  void viewerId;
  const d = await getDb();
  const followers = await d.prepare("SELECT COUNT(*) as c FROM follows WHERE following_id = ?").get(u.id) as { c?: number | null } | undefined;
  const following = await d.prepare("SELECT COUNT(*) as c FROM follows WHERE follower_id = ?").get(u.id) as { c?: number | null } | undefined;
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
    followers: Number(followers?.c || 0),
    following: Number(following?.c || 0),
  };
}


export async function serializePost(row: PostRow, viewerId?: string): Promise<ApiPost> {
  void viewerId;
  const d = await getDb();
  const userRow = await d.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id) as UserRow | undefined;
  const user = userRow ? await apiUserFromRow(userRow, viewerId) : null;

  const likes = await d.prepare("SELECT COUNT(*) as c FROM post_likes WHERE post_id = ?").get(row.id);
  const likedRow = viewerId ? await d.prepare("SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?").get(row.id, viewerId) : undefined;

  const commentRows = await d.prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC").all(row.id) as unknown as CommentRow[];
  const comments: ApiComment[] = [];
  for (const c of commentRows) {
    const cu = await d.prepare("SELECT * FROM users WHERE id = ?").get(c.user_id) as UserRow | undefined;
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
    musicUrl: row.music_url || null,
    musicName: row.music_name || null,
    comments,
    createdAt: row.created_at,
  };
}

export async function serializeStory(row: StoryRow, viewerId?: string): Promise<ApiStory> {
  const d = await getDb();
  const userRow = await d.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id) as UserRow | undefined;
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
    musicUrl: row.music_url || null,
    musicName: row.music_name || null,
    texts,
    viewed: !!viewed,
    createdAt: row.created_at,
  };
}

export function genId(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/**
 * Batch-serialize multiple posts in ~4 queries instead of N×5+.
 * Pre-loads all users, likes counts, liked status, and comments in bulk.
 */
export async function batchSerializePosts(rows: PostRow[], viewerId?: string): Promise<ApiPost[]> {
  if (rows.length === 0) return [];
  const d = await getDb();

  // 1) Collect all unique user IDs (post authors + comment authors)
  const commentRowsAll = await d.prepare(
    `SELECT * FROM comments WHERE post_id IN (${rows.map(() => "?").join(",")}) ORDER BY created_at ASC`
  ).all(...rows.map(r => r.id)) as unknown as (CommentRow & { post_id: string })[];

  const allUserIds = new Set<string>();
  rows.forEach(r => allUserIds.add(r.user_id));
  commentRowsAll.forEach(c => allUserIds.add(c.user_id));

  // 2) Load all users in ONE query
  const userIdArr = [...allUserIds];
  const userRows = userIdArr.length > 0
    ? await d.prepare(`SELECT * FROM users WHERE id IN (${userIdArr.map(() => "?").join(",")})`).all(...userIdArr) as unknown as UserRow[]
    : [];
  const userMap = new Map(userRows.map(u => [u.id, u]));

  // 3) Batch-load follower/following counts for all users
  const followerCounts = await d.prepare(
    `SELECT following_id, COUNT(*) as c FROM follows WHERE following_id IN (${userIdArr.map(() => "?").join(",")}) GROUP BY following_id`
  ).all(...userIdArr) as { following_id: string; c: number }[];
  const followingCounts = await d.prepare(
    `SELECT follower_id, COUNT(*) as c FROM follows WHERE follower_id IN (${userIdArr.map(() => "?").join(",")}) GROUP BY follower_id`
  ).all(...userIdArr) as { follower_id: string; c: number }[];
  const followerMap = new Map(followerCounts.map(f => [f.following_id, f.c]));
  const followingMap = new Map(followingCounts.map(f => [f.follower_id, f.c]));

  // 4) Build user objects from cached data
  const userCache = new Map<string, ApiUser>();
  for (const [id, u] of userMap) {
    userCache.set(id, {
      id: u.id,
      username: (u.username || u.name.toLowerCase().replace(/\s+/g, ".")),
      name: u.name,
      role: u.account_type,
      bio: u.bio || "",
      emoji: u.emoji || pick(EMOJIS, u.id),
      gradient: u.gradient || pick(GRADIENTS, u.id),
      avatarUrl: u.avatar_media || undefined,
      verified: !!u.verified,
      followers: followerMap.get(id) || 0,
      following: followingMap.get(id) || 0,
    });
  }

  // 5) Batch-load likes counts + liked status for all posts
  const postIdArr = rows.map(r => r.id);
  const likesCounts = await d.prepare(
    `SELECT post_id, COUNT(*) as c FROM post_likes WHERE post_id IN (${postIdArr.map(() => "?").join(",")}) GROUP BY post_id`
  ).all(...postIdArr) as { post_id: string; c: number }[];
  const likesMap = new Map(likesCounts.map(l => [l.post_id, l.c]));

  let likedSet = new Set<string>();
  if (viewerId) {
    const likedRows = await d.prepare(
      `SELECT post_id FROM post_likes WHERE post_id IN (${postIdArr.map(() => "?").join(",")}) AND user_id = ?`
    ).all(...postIdArr, viewerId) as { post_id: string }[];
    likedSet = new Set(likedRows.map(l => l.post_id));
  }

  // 6) Group comments by post_id
  const commentsByPost = new Map<string, (CommentRow & { post_id: string })[]>();
  for (const c of commentRowsAll) {
    const arr = commentsByPost.get(c.post_id) || [];
    arr.push(c);
    commentsByPost.set(c.post_id, arr);
  }

  // 7) Assemble final posts
  return rows.map(row => {
    const comments: ApiComment[] = (commentsByPost.get(row.id) || []).map(c => ({
      id: c.id,
      user: userCache.get(c.user_id) || ({} as ApiUser),
      text: c.text,
      createdAt: c.created_at,
    }));

    return {
      id: row.id,
      user: userCache.get(row.user_id)!,
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
      likes: likesMap.get(row.id) || 0,
      liked: likedSet.has(row.id),
      saved: false,
      likesHidden: !!row.likes_hidden,
      commentsDisabled: !!row.comments_disabled,
      musicId: row.music_id || null,
      musicUrl: row.music_url || null,
      musicName: row.music_name || null,
      comments,
      createdAt: row.created_at,
    };
  });
}
