"use client";

import { useEffect, useRef } from "react";

import { markConversationReadAction } from "@/modules/messages/actions";

type MarkConversationReadProps = {
  conversationId: string;
  unreadCount: number;
};

export function MarkConversationRead({
  conversationId,
  unreadCount,
}: MarkConversationReadProps) {
  const lastDispatchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (unreadCount <= 0) {
      return;
    }

    if (lastDispatchedRef.current === conversationId) {
      return;
    }

    lastDispatchedRef.current = conversationId;

    const formData = new FormData();
    formData.set("conversationId", conversationId);

    void markConversationReadAction(formData);
  }, [conversationId, unreadCount]);

  return null;
}
