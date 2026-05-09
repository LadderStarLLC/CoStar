'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessaging } from '@/context/MessagingContext';
import {
  archiveConversation,
  Conversation,
  createCoStarConversation,
  createConversation,
  Message,
  MessagingSearchResult,
  searchMessaging,
  subscribeToConversations,
  subscribeToMessages,
} from '@/lib/messaging';
import { Archive, ArrowLeft, Bot, Loader2, Maximize2, MessageCircle, Minimize2, Search, X } from 'lucide-react';
import InboxList from './InboxList';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
  const { user } = useAuth();
  const { isOpen, openMessaging, closeMessaging, activeConversationId, setActiveConversationId } = useMessaging();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MessagingSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConversations(
      user.uid,
      setConversations,
      (listenerError) => {
        console.warn('[Messaging] Conversations listener failed:', listenerError.message);
        setConversations([]);
      },
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isOpen || !activeConversationId) {
      setMessages([]);
      return;
    }
    const unsubscribe = subscribeToMessages(
      activeConversationId,
      setMessages,
      (listenerError) => {
        console.warn('[Messaging] Messages listener failed:', listenerError.message);
        setMessages([]);
      },
    );
    return () => unsubscribe();
  }, [activeConversationId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const queryText = searchTerm.trim();
    if (queryText.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = window.setTimeout(() => {
      searchMessaging(queryText)
        .then((results) => {
          if (!cancelled) setSearchResults(results);
        })
        .catch((searchError) => {
          if (!cancelled) {
            console.warn('[Messaging] Search failed:', searchError.message);
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchTerm, isOpen]);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const unreadCount = useMemo(
    () => conversations.filter((conversation) => conversation.unreadBy?.includes(user?.uid ?? '')).length,
    [conversations, user?.uid],
  );

  if (!user) return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => { openMessaging(); setIsMinimized(false); }} 
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-900 shadow-xl transition-transform hover:scale-105 hover:bg-amber-400"
        aria-label="Open messages"
      >
        <MessageCircle size={28} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-red-500 px-1 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  const otherParticipantId = activeConv
    ? activeConv.conversationType === 'ai'
      ? activeConv.participantIds.find(id => id !== user.uid)
      : activeConv.participantIds.find(id => id !== user.uid) || activeConv.participantIds[0]
    : null;
  const otherParticipant = activeConv && otherParticipantId ? activeConv.participants[otherParticipantId] : null;
  const activeTitle = activeConv?.conversationType === 'ai'
    ? activeConv.ai?.title || 'Co-Star AI'
    : otherParticipant?.name || 'Unknown User';

  async function handleStartCoStar() {
    setError(null);
    setIsStarting(true);
    try {
      const conversationId = await createCoStarConversation();
      setActiveConversationId(conversationId);
      setSearchTerm('');
      setSearchResults([]);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Could not start Co-Star chat.');
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSelectSearchResult(result: MessagingSearchResult) {
    setError(null);
    setIsStarting(true);
    try {
      if (result.type === 'conversation') {
        setActiveConversationId(result.id);
      } else if (result.type === 'ai') {
        const conversationId = await createCoStarConversation();
        setActiveConversationId(conversationId);
      } else {
        const { conversationId } = await createConversation({ targetUid: result.uid, conversationType: 'human' });
        setActiveConversationId(conversationId);
      }
      setSearchTerm('');
      setSearchResults([]);
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : 'Could not open this chat.');
    } finally {
      setIsStarting(false);
    }
  }

  async function handleArchiveConversation(conversationId: string) {
    setError(null);
    try {
      await archiveConversation(conversationId);
      setConversations((current) => current.filter((conversation) => conversation.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Could not archive this chat.');
    }
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl transition-all duration-300 ease-in-out ${isMinimized ? 'h-[56px] w-[320px]' : 'h-[640px] max-h-[84vh] w-[400px] max-w-[calc(100vw-32px)]'}`}>
      <div 
        className="flex shrink-0 cursor-pointer items-center justify-between border-b border-white/10 bg-slate-800 p-3" 
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex min-w-0 items-center gap-2">
          {activeConversationId && !isMinimized ? (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveConversationId(null); }}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Back to inbox"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                  {activeConv?.conversationType === 'ai' ? (
                    <Bot size={15} className="text-amber-400" />
                  ) : otherParticipant?.avatarUrl ? (
                    <>
                      {/* Messaging avatars are user-controlled URLs; keep img until we settle on a bounded remote image policy. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={otherParticipant.avatarUrl} alt={otherParticipant.name} className="h-7 w-7 rounded-full object-cover" />
                    </>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-300">
                      {otherParticipant?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <span className="max-w-[200px] truncate text-sm font-medium text-white">
                  {activeTitle}
                </span>
              </div>
            </>
          ) : (
            <h3 className="ml-2 flex items-center gap-2 font-semibold text-white">
              <MessageCircle size={18} className="text-amber-500" />
              Messages
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeConversationId && !isMinimized && (
            <button
              onClick={(e) => { e.stopPropagation(); handleArchiveConversation(activeConversationId); }}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-amber-300"
              title="Archive chat"
              aria-label="Archive chat"
            >
              <Archive size={16} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={isMinimized ? 'Maximize messages' : 'Minimize messages'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); closeMessaging(); }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
            aria-label="Close messages"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-900/90 backdrop-blur-sm">
          {activeConversationId ? (
            activeConv ? (
              <ChatWindow 
                conversation={activeConv}
                messages={messages}
                currentUserId={user.uid}
                participants={activeConv.participants}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening chat...
              </div>
            )
          ) : (
            <>
              <div className="border-b border-white/10 p-3">
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2">
                  <Search size={16} className="shrink-0 text-slate-500" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search chats, connections, people"
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  {(isSearching || isStarting) && <Loader2 size={16} className="animate-spin text-slate-500" />}
                </div>
                {error && <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}
                <button
                  type="button"
                  onClick={handleStartCoStar}
                  disabled={isStarting}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/15 disabled:opacity-50"
                >
                  <Bot size={16} />
                  New Co-Star chat
                </button>
              </div>
              <div className="h-full overflow-y-auto">
                {searchTerm.trim().length >= 2 ? (
                  <SearchResults results={searchResults} onSelect={handleSelectSearchResult} />
                ) : (
                  <InboxList 
                    conversations={conversations} 
                    currentUserId={user.uid} 
                    onSelect={(id) => setActiveConversationId(id)}
                    onArchive={handleArchiveConversation}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResults({
  results,
  onSelect,
}: {
  results: MessagingSearchResult[];
  onSelect: (result: MessagingSearchResult) => void;
}) {
  if (results.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-400">No matching chats or profiles.</div>;
  }

  return (
    <div className="flex flex-col divide-y divide-white/5">
      {results.map((result) => (
        <button
          key={`${result.type}-${result.id}`}
          onClick={() => onSelect(result)}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700">
            {result.type === 'ai' || (result.type === 'conversation' && result.conversationType === 'ai') ? (
              <Bot size={18} className="text-amber-400" />
            ) : result.image ? (
              <>
                {/* Search result thumbnails are mixed remote sources; keep img until we define an allowlist strategy. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.image} alt={result.title} className="h-10 w-10 rounded-full object-cover" />
              </>
            ) : (
              <span className="text-sm font-medium text-slate-300">{result.title.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-slate-100">{result.title}</div>
            <div className="mt-1 truncate text-sm text-slate-500">{result.subtitle || labelForResult(result.type)}</div>
          </div>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-500">
            {labelForResult(result.type)}
          </span>
        </button>
      ))}
    </div>
  );
}

function labelForResult(type: MessagingSearchResult['type']) {
  if (type === 'conversation') return 'Chat';
  if (type === 'connection') return 'Connection';
  if (type === 'ai') return 'AI';
  return 'Profile';
}
