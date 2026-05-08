import type { ChatMessage } from "@/lib/types";

export const chatReadEvent = "d185-chat-read-updated";

function storageKey(userId: string, weekKey: string) {
  return `d185:chat:last-read:${userId}:${weekKey}`;
}

export function getLastReadChatMessageId(userId: string, weekKey: string) {
  if (typeof window === "undefined" || !userId || !weekKey) {
    return "";
  }

  return window.localStorage.getItem(storageKey(userId, weekKey)) ?? "";
}

export function markChatMessagesRead(userId: string, weekKey: string, messages: ChatMessage[]) {
  const lastMessage = messages[messages.length - 1];

  if (typeof window === "undefined" || !userId || !weekKey || !lastMessage) {
    return;
  }

  window.localStorage.setItem(storageKey(userId, weekKey), lastMessage.id);
  window.dispatchEvent(new CustomEvent(chatReadEvent));
}
