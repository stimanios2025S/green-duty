"use client";
import { cn } from "@/lib/utils";

interface Props {
  user: { username?: string; name?: string; emoji?: string; gradient?: string };
  size?: number; // px
  ring?: boolean; // story gradient ring
  className?: string;
}

/** Instagram-style avatar: gradient circle + emoji. Optional story ring. */
export function InstaAvatar({ user, size = 40, ring = false, className }: Props) {
  const emoji = user.emoji || user.name?.charAt(0) || "🌿";
  return (
    <div
      className={cn("flex-shrink-0 rounded-full", ring && "bg-gradient-to-tr from-amber-400 via-orange-500 to-emerald-500 p-[2.5px]")}
      style={{ width: size, height: size }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-gd-deepest p-[2px]">
        <div
          className={cn("flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br", user.gradient || "from-amber-400 to-orange-600", className)}
          style={{ fontSize: size * 0.42 }}
          title={user.username || user.name}
        >
          {emoji}
        </div>
      </div>
    </div>
  );
}
