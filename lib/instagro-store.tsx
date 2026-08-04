"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { initialPosts, initialStories, InstaPost, InstaStory, InstaUser } from "./instagro-data";

interface InstaStoreValue {
  posts: InstaPost[];
  stories: InstaStory[];
  addPost: (p: InstaPost) => void;
  addStory: (s: InstaStory) => void;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  addComment: (id: string, user: InstaUser, text: string) => void;
  markStoryViewed: (id: string) => void;
}

const InstaContext = createContext<InstaStoreValue | null>(null);

export function InstaGroProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<InstaPost[]>(initialPosts);
  const [stories, setStories] = useState<InstaStory[]>(initialStories);

  const addPost = useCallback((p: InstaPost) => {
    setPosts(prev => [p, ...prev]);
  }, []);

  const addStory = useCallback((s: InstaStory) => {
    setStories(prev => [s, ...prev]);
  }, []);

  const toggleLike = useCallback((id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return p.liked ? { ...p, likes: p.likes - 1, liked: false } : { ...p, likes: p.likes + 1, liked: true };
    }));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, saved: !p.saved } : p)));
  }, []);

  const addComment = useCallback((id: string, user: InstaUser, text: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        comments: [...p.comments, { id: "c_" + Math.random().toString(36).slice(2, 8), user, text }],
      };
    }));
  }, []);

  const markStoryViewed = useCallback((id: string) => {
    setStories(prev => prev.map(s => (s.id === id ? { ...s, viewed: true } : s)));
  }, []);

  return (
    <InstaContext.Provider value={{ posts, stories, addPost, addStory, toggleLike, toggleSave, addComment, markStoryViewed }}>
      {children}
    </InstaContext.Provider>
  );
}

export function useInsta() {
  const ctx = useContext(InstaContext);
  if (!ctx) throw new Error("useInsta must be used within InstaGroProvider");
  return ctx;
}
