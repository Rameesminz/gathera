'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Hash, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { CallOverlay } from '@/components/call/call-overlay';
import { CallButtons, getCallParticipantIds } from '@/components/chat/call-buttons';
import { useChatWebSocket } from '@/hooks/use-chat-websocket';
import { initiateCall } from '@/lib/api/calls';
import { createChat, fetchMessages } from '@/lib/api/chats';
import { getApiErrorMessage } from '@/lib/api/client';
import { isCallEnabled, type ClubSettings } from '@/lib/club-settings';
import { useChatStore } from '@/stores/chat-store';
import { cn, formatDate } from '@/lib/utils';
import type { Chat, ClubMember, Message } from '@/types';
import type { ChatWsMessage } from '@/types/club-workspace';

interface ChatPanelProps {
  clubId: string;
  userId: string;
  displayName: string;
  initialChats: Chat[];
  members?: ClubMember[];
  clubSettings?: ClubSettings;
}

export function ChatPanel({
  clubId,
  userId,
  displayName,
  initialChats,
  members = [],
  clubSettings = {},
}: ChatPanelProps) {
  const [chats, setChats] = useState(initialChats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChats[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDmPicker, setShowDmPicker] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const [activeCall, setActiveCall] = useState<{ callId: string; withVideo: boolean } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const enableCall = isCallEnabled(clubSettings);

  const handleIncoming = useCallback((msg: ChatWsMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg as Message];
    });
  }, []);

  const { connected, sendMessage, sendTyping } = useChatWebSocket({
    chatId: selectedChatId ?? '',
    userId,
    displayName,
    enabled: !!selectedChatId,
    onMessage: handleIncoming,
  });

  useEffect(() => {
    if (!selectedChatId) return;
    setLoading(true);
    setError(null);
    fetchMessages(selectedChatId)
      .then((result) => setMessages(result.data))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [selectedChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selectedChatId) return;
    sendMessage(text);
    setInput('');
    sendTyping(false);
  };

  const handleStartCall = async (callType: 'voice' | 'video') => {
    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (!selectedChat || startingCall || activeCall) return;

    const participantIds = getCallParticipantIds(selectedChat, members, userId);
    if (participantIds.length === 0) {
      setError('No participants available for a call');
      return;
    }

    setStartingCall(true);
    setError(null);
    try {
      const result = await initiateCall(clubId, {
        callType,
        participantIds,
        chatId: selectedChat.id,
      });
      const callId = String(result.call.id);
      setActiveCall({ callId, withVideo: callType === 'video' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to start call'));
    } finally {
      setStartingCall(false);
    }
  };

  const handleCreateDm = async (memberId: string, memberName: string) => {
    try {
      const chat = await createChat(clubId, {
        type: 'direct',
        name: memberName,
        participantIds: [memberId],
      });
      setChats((prev) => {
        if (prev.some((c) => c.id === chat.id)) return prev;
        return [chat, ...prev];
      });
      setSelectedChatId(chat.id);
      setShowDmPicker(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to start direct message'));
    }
  };

  const handleCreateGroup = async () => {
    try {
      const chat = await createChat(clubId, {
        type: 'group',
        name: 'General',
        participantIds: [userId],
      });
      setChats((prev) => [chat, ...prev]);
      setSelectedChatId(chat.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create chat'));
    }
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const othersTyping = typingUsers.filter((t) => t.userId !== userId);

  return (
    <>
      {activeCall ? (
        <CallOverlay
          callId={activeCall.callId}
          userId={userId}
          isInitiator
          withVideo={activeCall.withVideo}
          onEnd={() => setActiveCall(null)}
        />
      ) : null}
    <div className="flex h-[calc(100dvh-8rem)] min-h-[500px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Chat list — WhatsApp-style on mobile toggles could be added */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-border bg-[var(--sidebar)] md:flex">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h2 className="font-semibold">Chats</h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDmPicker((v) => !v)}
              aria-label="Direct message"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCreateGroup} aria-label="New group chat">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {showDmPicker ? (
          <div className="max-h-40 overflow-y-auto border-b border-border p-2">
            {members
              .filter((m) => m.user_id !== userId && m.status === 'active')
              .map((member) => (
                <button
                  key={member.user_id}
                  type="button"
                  onClick={() => void handleCreateDm(member.user_id, member.display_name)}
                  className="mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  {member.display_name}
                </button>
              ))}
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto p-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => setSelectedChatId(chat.id)}
              className={cn(
                'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                selectedChatId === chat.id ? 'bg-[var(--sidebar-active)]' : 'hover:bg-muted',
              )}
            >
              <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {chat.type === 'direct' ? chat.name ?? 'Direct message' : chat.name ?? 'Group chat'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{formatDate(chat.updated_at)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedChat ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{selectedChat.name ?? 'Chat'}</h3>
                <p className="text-xs text-muted-foreground">
                  {connected ? 'Connected' : 'Reconnecting...'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <CallButtons
                  selectedChat={selectedChat}
                  userId={userId}
                  members={members}
                  enableCall={enableCall}
                  startingCall={startingCall}
                  onStartCall={(callType) => void handleStartCall(callType)}
                />
                <select
                  className="rounded-md border border-input bg-card px-2 py-1 text-sm md:hidden"
                  value={selectedChatId ?? ''}
                  onChange={(e) => setSelectedChatId(e.target.value)}
                >
                  {chats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? c.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--chat-bg)] p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : null}
              {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
              {messages.map((msg) => {
                const mine = msg.sender_id === userId;
                return (
                  <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                        mine
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-muted text-foreground',
                      )}
                    >
                      <p>{msg.content}</p>
                      <p className={cn('mt-1 text-[10px] opacity-70', mine ? 'text-right' : 'text-left')}>
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {othersTyping.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {othersTyping.map((t) => t.displayName).join(', ')} typing...
                </p>
              ) : null}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <Input
                  value={input}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-muted"
                  onChange={(e) => {
                    setInput(e.target.value);
                    sendTyping(e.target.value.length > 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button size="icon" className="rounded-full" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">Select or create a chat to start messaging</p>
            <Button onClick={handleCreateGroup}>Create group chat</Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
