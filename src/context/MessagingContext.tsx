'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MessagingContextType {
  isOpen: boolean;
  activeConversationId: string | null;
  openMessaging: (conversationId?: string) => void;
  closeMessaging: () => void;
  setActiveConversationId: (id: string | null) => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const openMessaging = (conversationId?: string) => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
    setIsOpen(true);
  };

  const closeMessaging = () => {
    setIsOpen(false);
  };

  return (
    <MessagingContext.Provider value={{ isOpen, activeConversationId, openMessaging, closeMessaging, setActiveConversationId }}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) throw new Error('useMessaging must be used within a MessagingProvider');
  return context;
};
