import type { User } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";
import { hoursAgo } from "./relativeTime";

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;

export const seedUsers: User[] = [
  {
    id: CURRENT_USER_ID,
    displayName: "You",
    avatarUrl: avatar("you"),
    isOnline: true,
  },
  {
    id: "user-maya",
    displayName: "Maya Chen",
    avatarUrl: avatar("maya"),
    isOnline: true,
    lastSeenAt: hoursAgo(0),
  },
  {
    id: "user-liam",
    displayName: "Liam Patel",
    avatarUrl: avatar("liam"),
    isOnline: false,
    lastSeenAt: hoursAgo(2),
  },
  {
    id: "user-sofia",
    displayName: "Sofia Rossi",
    avatarUrl: avatar("sofia"),
    isOnline: true,
    lastSeenAt: hoursAgo(0),
  },
  {
    id: "user-noah",
    displayName: "Noah Kim",
    avatarUrl: avatar("noah"),
    isOnline: false,
    lastSeenAt: hoursAgo(7),
  },
  {
    id: "user-priya",
    displayName: "Priya Sharma",
    avatarUrl: avatar("priya"),
    isOnline: true,
    lastSeenAt: hoursAgo(0),
  },
];

export const seedUsersById = Object.fromEntries(
  seedUsers.map((user) => [user.id, user]),
) as Record<string, User>;
