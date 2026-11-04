import { seedUsers, seedUsersById } from "@/data/users";
import { CURRENT_USER_ID, type User } from "@/types/chat";

export const currentUser: User = seedUsersById[CURRENT_USER_ID];

export function getUserById(id: string): User | undefined {
  return seedUsersById[id];
}

export function getAllUsers(): User[] {
  return seedUsers;
}
