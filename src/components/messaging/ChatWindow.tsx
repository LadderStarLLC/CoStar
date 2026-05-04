'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  Conversation,
  Message,
  Participant,
  markConversationRead,
  requestCoStarResponse,
  sendMessage,
} from '@/lib/messaging';
import RichTextEditor from './RichTextEditor';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bot, Loader2 } from 'lucide-react';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  participants: Record<string, Participant>;
}

function RichTextContent({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: (() => {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    })(),
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none',
      },
    },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}

export default function ChatWindow({ conversation, messages, currentUserId, participants }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    markConversationRead(conversation.id, currentUserId).catch((readError) => {
      console.warn('[Messaging] Mark read failed:', readError.message);
    });
  }, [messages, conversation.id, currentUserId]);

  const handleSend = async (content: string, previewText: string) => {
    setError(null);
    setSending(true);
    try {
      await sendMessage(conversation.id, currentUserId, content, previewText);
      if (conversation.conversationType === 'ai') {
        setAiThinking(true);
        await requestCoStarResponse(conversation.id);
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent.');
    } finally {
      setSending(false);
      setAiThinking(false);
    }
  };

  const inputDisabled = sending || aiThinking || conversation.status !== 'active';

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUserId;
          const isAi = msg.senderType === 'assistant';
          const sender = participants[msg.senderId];
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId || (msg.createdAt?.toDate && prevMsg.createdAt?.toDate && msg.createdAt.toDate().getTime() - prevMsg.createdAt.toDate().getTime() > 5 * 60 * 1000);

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showHeader && (
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                    {isAi && <Bot size={13} className="text-amber-400" />}
                    {isMe ? 'You' : sender?.name || 'Unknown User'}
                  </span>
                  {msg.createdAt?.toDate && (
                    <span className="text-xs text-slate-500">
                      {format(msg.createdAt.toDate(), 'h:mm a')}
                    </span>
                  )}
                </div>
              )}
              
              <div 
                className={`max-w-[82%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'rounded-tr-sm border border-amber-500/20 bg-amber-500/10 text-slate-200' 
                    : isAi
                      ? 'rounded-tl-sm border border-emerald-400/20 bg-emerald-400/10 text-slate-100'
                      : 'rounded-tl-sm border border-white/10 bg-slate-800 text-slate-200'
                }`}
              >
                <RichTextContent content={msg.content} />
              </div>
            </div>
          );
        })}
        {aiThinking && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            Co-Star is writing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 bg-slate-900/50 p-4">
        {error && <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}
        <RichTextEditor onSend={handleSend} disabled={inputDisabled} />
      </div>
    </div>
  );
}
