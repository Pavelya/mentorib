"use client";

import { createBrowserClient } from "@supabase/ssr";
import type {
  RealtimeChannel,
  RealtimePresenceState,
  SupabaseClient,
} from "@supabase/supabase-js";

import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { ParticipantRole } from "@/modules/messages/constants";

export type ConversationPresencePayload = {
  actorRole: ParticipantRole;
  since: string;
};

export type ConversationTypingPayload = {
  actorRole: ParticipantRole;
  ts: number;
};

export type ConversationBroadcastEvent =
  | { type: "message_created"; messageId: string }
  | { type: "reaction_changed"; messageId: string }
  | { type: "conversation_state_changed"; action: "muted" | "archived" | "unmuted" | "unarchived" };

export type ConversationChannelHandle = {
  channel: RealtimeChannel;
  broadcast: (event: ConversationBroadcastEvent) => Promise<void>;
  unsubscribe: () => Promise<"ok" | "timed out" | "error">;
  sendTyping: () => Promise<void>;
};

let browserClient: SupabaseClient<MentorIbDatabase> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<MentorIbDatabase> {
  if (browserClient) {
    return browserClient;
  }

  const { publishableKey, url } = getSupabasePublicEnv();

  browserClient = createBrowserClient<MentorIbDatabase>(url, publishableKey);

  return browserClient;
}

export type JoinConversationChannelOptions = {
  actorRole: ParticipantRole;
  conversationId: string;
  onBroadcast?: (event: ConversationBroadcastEvent) => void;
  onPresenceChange?: (state: RealtimePresenceState<ConversationPresencePayload>) => void;
  onTyping?: (payload: ConversationTypingPayload) => void;
};

export function joinConversationChannel(
  options: JoinConversationChannelOptions,
): ConversationChannelHandle {
  const supabase = getSupabaseBrowserClient();
  const topic = `conversation:${options.conversationId}`;

  const channel = supabase.channel(topic, {
    config: {
      broadcast: { ack: false, self: false },
      presence: { key: options.actorRole },
      private: true,
    },
  });

  if (options.onPresenceChange) {
    channel.on("presence", { event: "sync" }, () => {
      options.onPresenceChange?.(
        channel.presenceState<ConversationPresencePayload>(),
      );
    });
  }

  if (options.onTyping) {
    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      const typed = payload as ConversationTypingPayload | undefined;
      if (typed && typeof typed.ts === "number") {
        options.onTyping?.(typed);
      }
    });
  }

  if (options.onBroadcast) {
    channel.on("broadcast", { event: "conversation_event" }, ({ payload }) => {
      const typed = payload as ConversationBroadcastEvent | undefined;
      if (typed && typeof typed.type === "string") {
        options.onBroadcast?.(typed);
      }
    });
  }

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        actorRole: options.actorRole,
        since: new Date().toISOString(),
      } satisfies ConversationPresencePayload);
    }
  });

  return {
    broadcast: async (event) => {
      await channel.send({
        event: "conversation_event",
        payload: event,
        type: "broadcast",
      });
    },
    channel,
    sendTyping: async () => {
      await channel.send({
        event: "typing",
        payload: {
          actorRole: options.actorRole,
          ts: Date.now(),
        } satisfies ConversationTypingPayload,
        type: "broadcast",
      });
    },
    unsubscribe: async () => {
      await channel.untrack();
      return channel.unsubscribe();
    },
  };
}
