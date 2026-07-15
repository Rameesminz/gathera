export interface OnlineUser {
  id: string;
  displayName: string;
}

export interface ChatWsMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  metadata: string;
  client_message_id: string | null;
  ack_status: 'delivered' | 'failed' | 'pending';
  created_at: string;
}
