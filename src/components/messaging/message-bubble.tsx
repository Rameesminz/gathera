'use client';

import { Check, CheckCheck, Clock, AlertCircle, FileText } from 'lucide-react';
import { ChatImage } from '@/components/messaging/chat-image';
import { api } from '@/lib/api/client';
import { cn, formatMessageTime } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageBubbleProps {
  msg: Message;
  mine: boolean;
}

function parseMetadata(metadata: string): Record<string, unknown> {
  try { return JSON.parse(metadata) as Record<string, unknown>; }
  catch { return {}; }
}

function AckIcon({ status }: { status: Message['ack_status'] }) {
  if (status === 'pending') return <Clock className="h-3 w-3 opacity-60" />;
  if (status === 'failed') return <AlertCircle className="h-3 w-3 text-destructive" />;
  // delivered — show double-check (read indicator placeholder)
  return <CheckCheck className="h-3 w-3 opacity-70" />;
}

export function MessageBubble({ msg, mine }: MessageBubbleProps) {
  const meta = parseMetadata(msg.metadata);
  const isPending = msg.ack_status === 'pending';
  const isFailed = msg.ack_status === 'failed';

  const bubbleBase = cn(
    'relative max-w-[75%] break-words rounded-2xl px-3 py-2 text-sm shadow-sm',
    mine
      ? 'rounded-br-[4px] bg-primary text-primary-foreground'
      : 'rounded-bl-[4px] bg-card text-foreground',
    isPending && 'opacity-70',
  );

  const timeRow = (
    <div className={cn('mt-1 flex items-center gap-1', mine ? 'justify-end' : 'justify-start')}>
      {isFailed ? (
        <span className="text-[10px] text-destructive">Failed to send</span>
      ) : (
        <span className={cn('text-[10px] opacity-60', mine ? 'text-primary-foreground' : 'text-foreground')}>
          {isPending ? 'Sending…' : formatMessageTime(msg.created_at)}
        </span>
      )}
      {mine && <AckIcon status={msg.ack_status} />}
    </div>
  );

  if (msg.message_type === 'image' && meta.fileId) {
    return (
      <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
        <div className={cn('max-w-[75%] overflow-hidden rounded-2xl shadow-sm', mine ? 'rounded-br-[4px]' : 'rounded-bl-[4px]')}>
          <ChatImage chatId={msg.chat_id} fileId={String(meta.fileId)} alt={msg.content ?? 'Image'} />
          <div className={cn('px-3 py-1', mine ? 'bg-primary' : 'bg-card')}>
            {timeRow}
          </div>
        </div>
      </div>
    );
  }

  if (msg.message_type === 'file' && meta.fileId) {
    return (
      <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
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
          className={cn(bubbleBase, 'flex items-center gap-2 text-left')}
        >
          <FileText className="h-5 w-5 shrink-0 opacity-80" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{msg.content ?? 'File'}</p>
            {timeRow}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={bubbleBase}>
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        {timeRow}
      </div>
    </div>
  );
}
