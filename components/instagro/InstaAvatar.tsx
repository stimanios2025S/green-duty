"use client";
import { cn } from "@/lib/utils";
import { InstaUser } from "@/lib/instagro-data";

interface Props {
  user: InstaUser;
  size?: number; // px
  ring?: boolean; // story gradient ring
  className?: string;
}

/** Instagram-style avatar: gradient circle + emoji. Optional story ring. */
export function InstaAvatar({ user, size = 40, ring = false, className }: Props) {
  return (
    <div
      className={cn("flex-shrink-0 rounded-full", ring && "bg-gradient-to-tr from-amber-400 via-orange-500 to-emerald-500 p-[2.5px]")}
      style={{ width: size, height: size }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-gd-deepest p-[2px]">
        <div
          className={cn("flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br text-white", user.gradient, className)}
          style={{ fontSize: size * 0.42 }}
          title={user.username}
        >
          {user.emoji}
        </div>
      </div>
    </div>
  );
}
