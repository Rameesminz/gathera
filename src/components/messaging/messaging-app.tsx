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
  User,
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
  uploadChatFile,
} from '@/lib/api/chats';
import { fetchChatPolls } from '@/lib/api/polls';
import { searchUsers } from '@/lib/api/users';
import { useChatStore } from '@/stores/chat-store';
import { useMessagingStore } from '@/stores/messaging-store';
import { cn, formatConversationTime, formatMessageTime } from '@/lib/utils';
import type { Conversation, Message, Poll, PublicUser } from '@/types';
import type { ChatWsMessage } from '@/types/messaging';

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
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg as Message];
      });
      void refreshConversations();
    },
    [refreshConversations],
  );

  const { connected, sendMessage, sendTyping } = useChatWebSocket({
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
          setMessages(messageResult.data);
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
  }, [selectedChatId, markRead]);

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

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selectedChatId) return;
    sendMessage(text);
    setInput('');
    sendTyping(false);
    void refreshConversations();
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
    try {
      const chat = await createDirectChat(user.id);
      const conversation: Conversation = {
        ...chat,
        last_message_content: null,
        last_message_at: null,
        other_user_id: user.id,
        other_display_name: user.display_name,
        other_avatar_url: user.avatar_url,
        other_email: user.email,
        other_mobile_number: user.mobile_number,
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
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to start chat'));
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
          <div className={cn('max-w-[80%] overflow-hidden rounded-2xl shadow-sm', mine ? 'rounded-br-md' : 'rounded-bl-md')}>
            <ChatImage chatId={msg.chat_id} fileId={String(meta.fileId)} alt={msg.content ?? 'Image'} />
            <p className={cn('px-3 py-1 text-[10px] opacity-70', mine ? 'text-right text-primary-foreground bg-primary' : 'bg-muted')}>
              {formatMessageTime(msg.created_at)}
            </p>
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
              'max-w-[80%] rounded-2xl px-4 py-3 text-left text-sm shadow-sm underline',
              mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted',
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
            'max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm',
            mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted text-foreground',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          <p className={cn('mt-1 text-[10px] opacity-70', mine ? 'text-right' : 'text-left')}>
            {formatMessageTime(msg.created_at)}
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
          isInitiator
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

      <div className="flex h-[calc(100dvh-4rem)] overflow-hidden rounded-xl border border-border bg-card shadow-sm md:h-[calc(100dvh-5rem)]">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex w-full shrink-0 flex-col border-r border-border bg-[var(--sidebar)] md:w-96',
            mobileShowChat ? 'hidden md:flex' : 'flex',
          )}
        >
          <div className="border-b border-border p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Link href="/profile" className="flex min-w-0 items-center gap-3">
                <Avatar name={displayName} src={avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">Your profile</p>
                </div>
              </Link>
              <div className="flex gap-1">
                <Link href="/settings" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search by mobile number or email"
                className="rounded-full bg-muted pl-9"
              />
            </div>
            <Button
              type="button"
              className="mt-3 w-full rounded-full"
              onClick={() => setShowNewChat((v) => !v)}
            >
              <MessageCircle className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {showNewChat ? (
            <div className="border-b border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Input
                  value={newChatQuery}
                  onChange={(e) => setNewChatQuery(e.target.value)}
                  placeholder="Search by mobile number or email"
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewChat(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {!debouncedNewChatQuery ? (
                  <p className="px-1 py-2 text-sm text-muted-foreground">
                    Find users by email, mobile number, or name
                  </p>
                ) : searching ? (
                  <div className="flex justify-center py-4">
                    <Spinner className="h-5 w-5" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-muted-foreground">No users found</p>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => void handleOpenChat(user)}
                      className="mb-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
                    >
                      <Avatar name={user.display_name} src={user.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user.display_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
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
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-border/50 px-3 py-3 text-left transition-colors hover:bg-muted/60',
                      selectedChatId === conversation.id && 'bg-[var(--sidebar-active)]',
                    )}
                  >
                    <div className="relative">
                      <Avatar
                        name={conversationTitle(conversation)}
                        src={conversation.other_avatar_url}
                        size="md"
                      />
                      {isOnline ? (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--sidebar)] bg-primary" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{conversationTitle(conversation)}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatConversationTime(conversation.last_message_at ?? conversation.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm text-muted-foreground">
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
              <header className="flex items-center gap-3 border-b border-border px-3 py-3">
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
                  <h2 className="truncate font-semibold">{conversationTitle(selectedConversation)}</h2>
                  <p className="text-xs text-muted-foreground">
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
                  variant="ghost"
                  size="icon"
                  aria-label="Polls"
                  title="Polls"
                  onClick={() => setShowPolls((v) => !v)}
                >
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </header>

              <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--chat-bg)] p-4">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
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
                    {typingUsers.filter((t) => t.userId !== userId).length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {typingUsers
                          .filter((t) => t.userId !== userId)
                          .map((t) => t.displayName)
                          .join(', ')}{' '}
                        typing...
                      </p>
                    ) : null}
                    <div ref={bottomRef} />
                  </div>

                  <div className="border-t border-border p-3">
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
                        size="icon"
                        className="shrink-0 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file"
                      >
                        <Paperclip className="h-5 w-5" />
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
                        className="shrink-0 rounded-full"
                        onClick={handleSend}
                        disabled={!input.trim()}
                        aria-label="Send message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {showPolls ? (
                  <aside className="fixed inset-0 z-40 flex flex-col bg-card lg:static lg:inset-auto lg:z-auto lg:w-80 lg:shrink-0 lg:border-l lg:border-border">
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
                        <p className="text-sm text-muted-foreground">No polls in this chat yet.</p>
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
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--chat-bg)] p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Gathera Messages</h2>
                <p className="mt-1 max-w-sm text-muted-foreground">
                  Send and receive messages, share files, create polls, and make voice or video calls.
                </p>
              </div>
              <Button onClick={() => setShowNewChat(true)}>Start a new chat</Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
