'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bot } from 'lucide-react';
import { Conversation } from '@/lib/messaging';

interface InboxListProps {
  conversations: Conversation[];
  currentUserId: string;
  activeConversationId?: string;
  onSelect?: (id: string) => void;
}

export default function InboxList({ conversations, currentUserId, activeConversationId, onSelect }: InboxListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-white/5">
      {conversations.map((conv) => {
        const otherParticipantId = conv.conversationType === 'ai'
          ? conv.participantIds.find(id => id !== currentUserId)
          : conv.participantIds.find(id => id !== currentUserId) || conv.participantIds[0];
        const otherParticipant = otherParticipantId ? conv.participants[otherParticipantId] : null;
        
        const isUnread = conv.unreadBy?.includes(currentUserId) ?? false;
        const isActive = conv.id === activeConversationId;
        const timestamp = conv.lastUpdatedAt?.toDate ? conv.lastUpdatedAt.toDate() : new Date();
        const title = conv.conversationType === 'ai'
          ? conv.ai?.title || 'Co-Star AI'
          : otherParticipant?.name || 'Unknown User';

        return (
          <button 
            key={conv.id} 
            onClick={() => onSelect && onSelect(conv.id)}
            className={`flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-white/5 ${isActive ? 'bg-white/5' : ''}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700">
              {conv.conversationType === 'ai' ? (
                <Bot size={18} className="text-amber-400" />
              ) : otherParticipant?.avatarUrl ? (
                <img src={otherParticipant.avatarUrl} alt={otherParticipant.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-slate-300">
                  {otherParticipant?.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`truncate font-medium ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                  {title}
                </h3>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
              </div>
              
              {conv.lastMessage ? (
                <p className={`mt-1 truncate text-sm ${isUnread ? 'font-medium text-amber-400' : 'text-slate-400'}`}>
                  {conv.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                  {conv.lastMessage.text}
                </p>
              ) : (
                <p className="mt-1 text-sm italic text-slate-500">New conversation</p>
              )}
            </div>
            
            {isUnread && (
              <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
