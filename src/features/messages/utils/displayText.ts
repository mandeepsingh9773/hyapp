import { DELETED_MESSAGE_TEXT, type Message } from "@/types/chat";

export function displayTextOf(message: Message): string {
  return message.deletedAt ? DELETED_MESSAGE_TEXT : message.text;
}
