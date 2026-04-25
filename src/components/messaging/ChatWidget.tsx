'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import { Conversation, subscribeToConversations, Message, subscribeToMessages } from '@/lib/messaging';
import { MessageCircle, ArrowLeft, Maximize2, Minimize2, X } from 'lucide-react';
import InboxList from './InboxList';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
  const { user } = useAuth();
  const { isOpen, openMessaging, closeMessaging, activeConversationId, setActiveConversationId } = useMessaging();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConversations(user.uid, setConversations);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const unsubscribe = subscribeToMessages(activeConversationId, setMessages);
    return () => unsubscribe();
  }, [activeConversationId]);

  if (!user) return null;

  // The floating action button when closed
  if (!isOpen) {
    const unreadCount = conversations.filter(c => c.lastMessage && !c.lastMessage.isRead && c.lastMessage.senderId !== user.uid).length;
    return (
      <button 
        onClick={() => { openMessaging(); setIsMinimized(false); }} 
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 z-50"
      >
        <MessageCircle size={28} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const otherParticipantId = activeConv ? (activeConv.participantIds.find(id => id !== user.uid) || activeConv.participantIds[0]) : null;
  const otherParticipant = activeConv && otherParticipantId ? activeConv.participants[otherParticipantId] : null;

  return (
    <div className={`fixed right-6 bottom-6 flex flex-col bg-slate-900 border border-white/10 shadow-2xl rounded-xl overflow-hidden z-50 transition-all duration-300 ease-in-out ${isMinimized ? 'h-[56px] w-[320px]' : 'h-[600px] max-h-[80vh] w-[380px] max-w-[calc(100vw-32px)]'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-slate-800 border-b border-white/10 cursor-pointer shrink-0" 
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          {activeConversationId && !isMinimized ? (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveConversationId(null); }}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  {otherParticipant?.avatarUrl ? (
                    <img src={otherParticipant.avatarUrl} alt={otherParticipant.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-medium text-slate-300">
                      {otherParticipant?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <span className="font-medium text-sm text-white truncate max-w-[150px]">
                  {otherParticipant?.name || 'Unknown User'}
                </span>
              </div>
            </>
          ) : (
            <h3 className="font-semibold text-white ml-2 flex items-center gap-2">
              <MessageCircle size={18} className="text-amber-500" />
              Messages
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); closeMessaging(); }}
            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-900/90 backdrop-blur-sm">
          {activeConversationId && activeConv ? (
            <ChatWindow 
              conversationId={activeConversationId}
              messages={messages}
              currentUserId={user.uid}
              participants={activeConv.participants}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <InboxList 
                conversations={conversations} 
                currentUserId={user.uid} 
                onSelect={(id) => setActiveConversationId(id)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
