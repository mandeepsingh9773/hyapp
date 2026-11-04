import type { Conversation } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";
import { minutesAgo } from "./relativeTime";

const groupAvatar = (seed: string) =>
  `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`;

export const seedConversations: Conversation[] = [
  {
    id: "conv-maya",
    type: "direct",
    title: "Maya Chen",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=maya",
    participantIds: [CURRENT_USER_ID, "user-maya"],
    updatedAt: minutesAgo(3),
  },
  {
    id: "conv-design-team",
    type: "group",
    title: "Design Team",
    avatarUrl: groupAvatar("design-team"),
    participantIds: [
      CURRENT_USER_ID,
      "user-maya",
      "user-liam",
      "user-sofia",
    ],
    updatedAt: minutesAgo(18),
  },
  {
    id: "conv-liam",
    type: "direct",
    title: "Liam Patel",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=liam",
    participantIds: [CURRENT_USER_ID, "user-liam"],
    updatedAt: minutesAgo(64),
  },
  {
    id: "conv-weekend-hike",
    type: "group",
    title: "Weekend Hike",
    avatarUrl: groupAvatar("weekend-hike"),
    participantIds: [
      CURRENT_USER_ID,
      "user-noah",
      "user-priya",
      "user-sofia",
    ],
    updatedAt: minutesAgo(140),
  },
  {
    id: "conv-priya",
    type: "direct",
    title: "Priya Sharma",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=priya",
    participantIds: [CURRENT_USER_ID, "user-priya"],
    updatedAt: minutesAgo(240),
  },
];
