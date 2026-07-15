'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Settings,
  Smile,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { CallOverlay } from '@/components/call/call-overlay';
import { CallButtons } from '@/components/messaging/call-buttons';
import { CreatePollModal } from '@/components/messaging/create-poll-modal';
import { PollMessage } from '@/components/messaging/poll-message';
import { useChatWebSocket } from '@/hooks/use-chat-websocket';
import { initiateChatCall } from '@/lib/api/calls';
import { ChatImage } from '@/components/messaging/chat-image';
import { api, getApiErrorMessage } from '@/lib/api/client';
import {
  createDirectChat,
  fetchChatParticipants,
  fetchConversations,
  fetchMessages,
  sendMessage as sendMessageHttp,
  uploadChatFile,
} from '@/lib/api/chats';
import { fetchChatPolls } from '@/lib/api/polls';
import { searchUsers } from '@/lib/api/users';
import { useChatStore } from '@/stores/chat-store';
import { useMessagingStore } from '@/stores/messaging-store';
import { cn, formatConversationTime, formatMessageTime } from '@/lib/utils';
import type { Conversation, Message, Poll, PublicUser } from '@/types';
import { User } from 'lucide-react';
import type { ChatWsMessage } from '@/types/messaging';

// Stable UUID v4 generator (crypto.randomUUID with fallback)
function newClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface MessagingAppProps {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  initialConversations: Conversation[];
}

function conversationTitle(conversation: Conversation) {
  if (conversation.type === 'direct') {
    return conversation.other_display_name ?? conversation.other_email ?? 'Direct message';
  }
  return conversation.name ?? 'Group chat';
}

function conversationPreview(conversation: Conversation) {
  if (conversation.last_message_content) return conversation.last_message_content;
  return 'No messages yet';
}

function parseMetadata(metadata: string): Record<string, unknown> {
  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function MessagingApp({
  userId,
  displayName,
  avatarUrl,
  initialConversations,
}: MessagingAppProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState('');
  const [debouncedNewChatQuery, setDebouncedNewChatQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [openingChatUserId, setOpeningChatUserId] = useState<string | null>(null);
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const [startingCall, setStartingCall] = useState(false);
  const [activeCall, setActiveCall] = useState<{ callId: string; withVideo: boolean } | null>(null);
  const [chatParticipantIds, setChatParticipantIds] = useState<string[]>([]);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const markRead = useMessagingStore((s) => s.markRead);
  const getUnreadCount = useMessagingStore((s) => s.getUnreadCount);
  const enqueuePending = useMessagingStore((s) => s.enqueuePending);
  const dequeuePending = useMessagingStore((s) => s.dequeuePending);
  // Stable refs — avoids re-triggering the chat-load useEffect on every render
  const getPendingForChatRef = useRef(useMessagingStore.getState().getPendingForChat);
  const buildOptimisticMessageRef = useRef(useMessagingStore.getState().buildOptimisticMessage);
  const sendingRef = useRef(false);

  const selectedConversation = conversations.find((c) => c.id === selectedChatId) ?? null;

  const refreshConversations = useCallback(async () => {
    try {
      const updated = await fetchConversations();
      setConversations(updated);
    } catch {
      // keep existing list
    }
  }, []);

  const handleIncoming = useCallback(
    (msg: ChatWsMessage) => {
      setMessages((prev) => {
        // Replace any optimistic entry (pending OR already-replaced-by-HTTP) with the
        // canonical server copy, guarding on client_message_id alone so we don't
        // append a duplicate when the WS broadcast races the HTTP response.
        if (msg.client_message_id) {
          const hasOptimistic = prev.some(
            (m) => m.client_message_id === msg.client_message_id,
          );
          if (hasOptimistic) {
            dequeuePending(msg.client_message_id);
            return prev.map((m) =>
              m.client_message_id === msg.client_message_id ? (msg as Message) : m,
            );
          }
        }
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg as Message];
      });
      void refreshConversations();
    },
    [refreshConversations, dequeuePending],
  );

  const { connected, sendTyping } = useChatWebSocket({
    chatId: selectedChatId ?? '',
    userId,
    displayName,
    enabled: !!selectedChatId,
    onMessage: handleIncoming,
  });

  useEffect(() => {
    if (!selectedChatId) return;
    let cancelled = false;
    markRead(selectedChatId);

    void Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);
      try {
        const [messageResult, pollResult, participantIds] = await Promise.all([
          fetchMessages(selectedChatId),
          fetchChatPolls(selectedChatId),
          fetchChatParticipants(selectedChatId),
        ]);
        if (!cancelled) {
          const serverMessages = messageResult.data;
          // Re-attach any persisted pending messages not yet ACK'd.
          // Use stable refs so this effect only re-runs when selectedChatId/userId change.
          const pending = getPendingForChatRef.current(selectedChatId).map((p) =>
            buildOptimisticMessageRef.current(p, userId),
          );
          setMessages([...serverMessages.reverse(), ...pending]);
          setPolls(pollResult);
          setChatParticipantIds(participantIds);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedChatId, markRead, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers, polls]);

  useEffect(() => {
    if (!showNewChat) return;
    const timeoutId = window.setTimeout(() => setDebouncedNewChatQuery(newChatQuery.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [newChatQuery, showNewChat]);

  useEffect(() => {
    if (!showNewChat || !debouncedNewChatQuery) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      setSearching(true);
      try {
        const users = await searchUsers(debouncedNewChatQuery);
        if (!cancelled) setSearchResults(users.filter((u) => u.id !== userId));
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedNewChatQuery, showNewChat, userId]);

  const filteredConversations = conversations.filter((conversation) => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return true;
    const title = conversationTitle(conversation).toLowerCase();
    const email = conversation.other_email?.toLowerCase() ?? '';
    const mobile = conversation.other_mobile_number?.toLowerCase() ?? '';
    return title.includes(q) || email.includes(q) || mobile.includes(q);
  });

  const otherParticipantOnline =
    selectedConversation?.other_user_id &&
    onlineUsers.some((u) => u.id === selectedConversation.other_user_id);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    markRead(chatId);
    setMobileShowChat(true);
    setShowPolls(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedChatId || sendingRef.current) return;
    sendingRef.current = true;

    const clientMessageId = newClientId();
    const pending = { clientMessageId, chatId: selectedChatId, content: text, createdAt: new Date().toISOString() };

    setInput('');
    sendTyping(false);

    // Optimistic: show message immediately as pending
    enqueuePending(pending);
    setMessages((prev) => [...prev, buildOptimisticMessageRef.current(pending, userId)]);

    try {
      const { message } = await sendMessageHttp(selectedChatId, text, 'text', undefined, clientMessageId);
      // Replace optimistic entry with confirmed message from server.
      // The WS broadcast may arrive before or after this — handleIncoming guards both.
      dequeuePending(clientMessageId);
      setMessages((prev) =>
        prev.map((m) => (m.client_message_id === clientMessageId ? message : m)),
      );
      void refreshConversations();
    } catch (err) {
      // Mark as failed in UI; keep in pending queue so it survives page refresh.
      setMessages((prev) =>
        prev.map((m) =>
          m.client_message_id === clientMessageId ? { ...m, ack_status: 'failed' as const } : m,
        ),
      );
      setError(getApiErrorMessage(err, 'Failed to send message'));
    } finally {
      sendingRef.current = false;
    }
  };

  const handleStartCall = async (callType: 'voice' | 'video') => {
    if (!selectedChatId || startingCall || activeCall) return;
    const participantIds = chatParticipantIds.filter((id) => id !== userId);
    if (participantIds.length === 0) {
      setError('No participants available for a call');
      return;
    }
    setStartingCall(true);
    setError(null);
    try {
      const result = await initiateChatCall(selectedChatId, { callType, participantIds });
      setActiveCall({ callId: String(result.call.id), withVideo: callType === 'video' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to start call'));
    } finally {
      setStartingCall(false);
    }
  };

  const handleOpenChat = async (user: PublicUser) => {
    if (openingChatUserId) return;
    setOpeningChatUserId(user.id);
    setNewChatError(null);
    try {
      const chat = await createDirectChat(user.id);
      if (!chat?.id) {
        throw new Error('The server did not return a valid conversation');
      }
      const conversation: Conversation = {
        ...chat,
        last_message_content: chat.last_message_content ?? null,
        last_message_at: chat.last_message_at ?? null,
        other_user_id: chat.other_user_id ?? user.id,
        other_display_name: chat.other_display_name ?? user.display_name,
        other_avatar_url: chat.other_avatar_url ?? user.avatar_url,
        other_email: chat.other_email ?? user.email,
        other_mobile_number: chat.other_mobile_number ?? user.mobile_number,
      };
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== conversation.id);
        return [conversation, ...remaining];
      });
      setSelectedChatId(conversation.id);
      setShowNewChat(false);
      setNewChatQuery('');
      setSearchResults([]);
      setMobileShowChat(true);
      setError(null);
      void refreshConversations();
    } catch (err) {
      console.error('[messaging] Failed to open/create direct chat', err);
      setNewChatError(getApiErrorMessage(err, 'Failed to start chat'));
    } finally {
      setOpeningChatUserId(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedChatId) return;
    setError(null);
    try {
      const { message } = await uploadChatFile(selectedChatId, file);
      setMessages((prev) => [...prev, message]);
      void refreshConversations();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to upload file'));
    }
  };

  const renderMessage = (msg: Message) => {
    const mine = msg.sender_id === userId;
    const meta = parseMetadata(msg.metadata);

    if (msg.message_type === 'image' && meta.fileId) {
      return (
        <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
          <div className={cn('group relative max-w-[75%] overflow-hidden rounded-2xl shadow-md md:max-w-[60%]', mine ? 'rounded-br-lg' : 'rounded-bl-lg')}>
            <ChatImage chatId={msg.chat_id} fileId={String(meta.fileId)} alt={msg.content ?? 'Image'} />
            <div className="absolute bottom-1 right-2 hidden items-center gap-1 group-hover:flex">
              {formatMessageTime(msg.created_at)}
            </div>
          </div>
        </div>
      );
    }

    if (msg.message_type === 'file' && meta.fileId) {
      return (
        <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
          <button
            type="button"
            onClick={() => {
              void api
                .get(`/chats/${msg.chat_id}/files/${meta.fileId}`, { responseType: 'blob' })
                .then((response) => {
                  const url = URL.createObjectURL(response.data as Blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = msg.content ?? 'file';
                  link.click();
                  URL.revokeObjectURL(url);
                });
            }}
            className={cn(
              'flex max-w-[75%] items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm shadow-md transition-colors hover:underline md:max-w-[60%]',
              mine ? 'rounded-br-lg bg-blue-600 text-white' : 'rounded-bl-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
            )}
          >
            {msg.content ?? 'File'}
          </button>
        </div>
      );
    }

    return (
      <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-md md:max-w-[60%]',
            mine ? 'rounded-br-lg bg-blue-600 text-white' : 'rounded-bl-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
            msg.ack_status === 'pending' && 'opacity-70',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          <p className={cn('mt-1 text-[11px] opacity-70', mine ? 'text-right' : 'text-left')}>
            {msg.ack_status === 'pending'
              ? 'Sending…'
              : msg.ack_status === 'failed'
                ? '⚠ Failed'
                : formatMessageTime(msg.created_at)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {activeCall ? (
        <CallOverlay
          callId={activeCall.callId}
          userId={userId}
          isInitiator={true}
          withVideo={activeCall.withVideo}
          onEnd={() => setActiveCall(null)}
        />
      ) : null}
      <CreatePollModal
        chatId={selectedChatId ?? ''}
        open={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreated={(poll) => setPolls((prev) => [poll, ...prev])}
      />

      <div className="flex h-[calc(100dvh-4rem)] overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-lg dark:border-gray-800/80 dark:bg-gray-900 md:h-[calc(100dvh-5rem)]">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex w-full shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 md:w-80 lg:w-96',
            mobileShowChat ? 'hidden md:flex' : 'flex',
          )}
        >
          <div className="border-b border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Link href="/profile" className="flex min-w-0 items-center gap-3 rounded-lg p-1 transition-colors hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
                <Avatar name={displayName} src={avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">Online</p>
                </div>
              </Link>
              <div className="flex gap-1">
                <Link href="/settings" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search by mobile number or email"
                className="rounded-full bg-muted pl-9"
              />
            </div>
            <Button
              type="button"
              className="mt-4 w-full rounded-full"
              onClick={() => {
                setNewChatError(null);
                setShowNewChat((v) => !v);
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          {showNewChat ? (
            <div className="border-b border-gray-200 p-3 dark:border-gray-800">
              <div className="mb-2 flex items-center gap-2">
                <Input
                  value={newChatQuery}
                  onChange={(e) => {
                    setNewChatQuery(e.target.value);
                    if (newChatError) setNewChatError(null);
                  }}
                  placeholder="Search by mobile number or email"
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewChat(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {newChatError ? (
                <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {newChatError}
                </p>
              ) : null}
              <div className="max-h-48 overflow-y-auto">
                {!debouncedNewChatQuery ? (
                  <p className="px-1 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Find users by email, mobile number, or name
                  </p>
                ) : searching ? (
                  <div className="flex justify-center py-4">
                    <Spinner className="h-5 w-5" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-gray-500 dark:text-gray-400">No users found</p>
                ) : (
                  searchResults.map((user) => {
                    const opening = openingChatUserId === user.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        disabled={!!openingChatUserId}
                        onClick={() => { void handleOpenChat(user); }}
                        className="mb-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-200/60 disabled:opacity-60 dark:hover:bg-gray-800/60"
                      >
                        <Avatar name={user.display_name} src={user.avatar_url} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{user.display_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.mobile_number ? `${user.email} · ${user.mobile_number}` : user.email}
                          </p>
                        </div>
                        {opening ? <Spinner className="h-4 w-4 shrink-0" /> : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No conversations yet. Start a new chat.
              </p>
            ) : (
              filteredConversations.map((conversation) => {
                const unread = getUnreadCount(conversation.id, conversation.last_message_at);
                const isOnline =
                  conversation.other_user_id &&
                  onlineUsers.some((u) => u.id === conversation.other_user_id);
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => handleSelectChat(conversation.id)}
                    className={cn( //
                      'flex w-full items-center gap-3 border-b border-gray-200/60 px-4 py-3 text-left transition-colors hover:bg-gray-200/60 dark:border-gray-800/60 dark:hover:bg-gray-800/60',
                      selectedChatId === conversation.id && 'bg-blue-50 dark:bg-gray-800/80',
                    )}
                  >
                    <div className="relative">
                      <Avatar
                        name={conversationTitle(conversation)}
                        src={conversation.other_avatar_url}
                        size="md"
                      />
                      {isOnline ? ( //
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-50 bg-green-500 dark:border-gray-950" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{conversationTitle(conversation)}</p>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          {formatConversationTime(conversation.last_message_at ?? conversation.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('truncate text-sm', unread > 0 ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400')}>
                          {conversationPreview(conversation)}
                        </p>
                        {unread > 0 ? (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <section
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            !mobileShowChat && !selectedConversation ? 'hidden md:flex' : 'flex',
            mobileShowChat ? 'flex' : 'hidden md:flex',
          )}
        >
          {selectedConversation ? (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileShowChat(false)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar
                  name={conversationTitle(selectedConversation)}
                  src={selectedConversation.other_avatar_url}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold">{conversationTitle(selectedConversation)}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {otherParticipantOnline
                      ? 'Online'
                      : connected
                        ? 'Last seen recently'
                        : 'Reconnecting...'}
                  </p>
                </div>
                <CallButtons
                  participantIds={chatParticipantIds.filter((id) => id !== userId)}
                  startingCall={startingCall}
                  onStartCall={(callType) => void handleStartCall(callType)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Polls"
                  title="Polls"
                  onClick={() => setShowPolls((v) => !v)}
                >
                  <BarChart3 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </Button>
              </header>

              <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex-1 space-y-4 overflow-y-auto bg-gray-100/50 p-4 dark:bg-gray-900/80">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Spinner className="h-8 w-8" />
                      </div>
                    ) : null}
                    {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
                    {polls.map((poll) => (
                      <div key={poll.id} className="flex justify-center">
                        <PollMessage
                          poll={poll}
                          userId={userId}
                          onUpdate={(updated) =>
                            setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                          }
                        />
                      </div>
                    ))}
                    {messages.map(renderMessage)}
                    {typingUsers.filter((t) => t.userId !== userId).length > 0 && (
                      <div className="flex justify-start">
                        <div className="rounded-bl-lg rounded-2xl bg-gray-200 px-3 py-2 text-sm text-gray-500 shadow-md dark:bg-gray-700 dark:text-gray-400">
                        {typingUsers
                          .filter((t) => t.userId !== userId)
                          .map((t) => t.displayName)
                          .join(', ')}{' '}
                          is typing...
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <div className="shrink-0 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
                    <div className="flex items-end gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFileUpload(file);
                          e.target.value = '';
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon" //
                        className="shrink-0 rounded-full text-gray-500 hover:bg-gray-200/60 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon" //
                        className="shrink-0 rounded-full text-gray-500 hover:bg-gray-200/60 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200"
                        aria-label="Emoji"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                      <Input
                        value={input}
                        placeholder="Type a message"
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
                      <Button
                        size="icon"
                        className="shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600/50"
                        onClick={handleSend}
                        disabled={!input.trim()}
                        aria-label="Send message"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {showPolls ? (
                  <aside className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-gray-950 lg:static lg:inset-auto lg:z-auto lg:w-80 lg:shrink-0 lg:border-l lg:border-border">
                    <div className="flex items-center justify-between border-b border-border p-3">
                      <h3 className="font-semibold">Polls</h3>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={() => setShowPollModal(true)}>
                          New poll
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="lg:hidden"
                          onClick={() => setShowPolls(false)}
                          aria-label="Close polls"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto p-3">
                      {polls.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No polls in this chat yet.</p>
                      ) : (
                        polls.map((poll) => (
                          <PollMessage
                            key={poll.id}
                            poll={poll}
                            userId={userId}
                            onUpdate={(updated) =>
                              setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                            }
                          />
                        ))
                      )}
                    </div>
                  </aside>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-100/50 p-8 text-center dark:bg-gray-900/80">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
                <MessageCircle className="h-12 w-12 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Welcome to Gathera</h2>
                <p className="mt-2 max-w-sm text-gray-500 dark:text-gray-400">
                  Select a conversation or start a new one to begin messaging.
                </p>
              </div>
              <Button
                size="lg"
                className="mt-4 rounded-full"
                onClick={() => {
                  setNewChatError(null);
                  setMobileShowChat(false);
                  setShowNewChat(true);
                }}
              >
                Start a new chat
              </Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
