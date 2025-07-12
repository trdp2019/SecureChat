import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  type: 'text' | 'image' | 'file';
  content: string;
  sender: string;
  timestamp: Date;
  fileName?: string;
  fileSize?: number;
}

export interface User {
  nickname: string;
  isTyping: boolean;
}

export interface ChatRoom {
  id: string;
  pin: string;
  expiresAt: Date;
}

export function useChat() {
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate unique PIN
  const generatePin = useCallback(async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_unique_pin');
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error generating PIN:', err);
      // Fallback to client-side generation
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  }, []);

  // Create a new chat room
  const createRoom = useCallback(async (nickname: string): Promise<string> => {
    try {
      setError(null);
      const pin = await generatePin();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          pin,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const room: ChatRoom = {
        id: data.id,
        pin: data.pin,
        expiresAt: new Date(data.expires_at)
      };

      setCurrentRoom(room);
      await joinRoomRealtime(room.id, nickname);
      
      return pin;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [generatePin]);

  // Join existing room
  const joinRoom = useCallback(async (pin: string, nickname: string): Promise<void> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('pin', pin.toUpperCase())
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Room not found or expired');
      }

      const room: ChatRoom = {
        id: data.id,
        pin: data.pin,
        expiresAt: new Date(data.expires_at)
      };

      setCurrentRoom(room);
      await joinRoomRealtime(room.id, nickname);
      await loadMessages(room.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Join room realtime channels
  const joinRoomRealtime = useCallback(async (roomId: string, nickname: string) => {
    // Clean up existing channels
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }
    if (presenceRef.current) {
      await supabase.removeChannel(presenceRef.current);
    }

    // Messages channel
    channelRef.current = supabase
      .channel(`room:${roomId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            type: payload.new.message_type,
            content: payload.new.content,
            sender: payload.new.sender_nickname,
            timestamp: new Date(payload.new.created_at),
            fileName: payload.new.file_name,
            fileSize: payload.new.file_size
          };
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Presence channel
    presenceRef.current = supabase
      .channel(`room:${roomId}:presence`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          loadPresence(roomId);
        }
      )
      .subscribe();

    // Update user presence
    await updatePresence(roomId, nickname, false);
    setIsConnected(true);
  }, []);

  // Load existing messages
  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        type: msg.message_type,
        content: msg.content,
        sender: msg.sender_nickname,
        timestamp: new Date(msg.created_at),
        fileName: msg.file_name,
        fileSize: msg.file_size
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, []);

  // Load user presence
  const loadPresence = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('room_id', roomId)
        .gt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

      if (error) throw error;

      const activeUsers: User[] = data.map(user => ({
        nickname: user.nickname,
        isTyping: user.is_typing
      }));

      setUsers(activeUsers);
    } catch (err) {
      console.error('Error loading presence:', err);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    nickname: string,
    type: 'text' | 'image' | 'file' = 'text',
    fileName?: string,
    fileSize?: number
  ) => {
    if (!currentRoom) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: currentRoom.id,
          sender_nickname: nickname,
          content,
          message_type: type,
          file_name: fileName,
          file_size: fileSize
        });

      if (error) throw error;

      // Update presence to show user is active
      await updatePresence(currentRoom.id, nickname, false);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  }, [currentRoom]);

  // Update typing status
  const updateTypingStatus = useCallback(async (nickname: string, isTyping: boolean) => {
    if (!currentRoom) return;

    try {
      await updatePresence(currentRoom.id, nickname, isTyping);
      
      if (isTyping) {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          updatePresence(currentRoom.id, nickname, false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating typing status:', err);
    }
  }, [currentRoom]);

  // Update user presence
  const updatePresence = useCallback(async (roomId: string, nickname: string, isTyping: boolean) => {
    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          room_id: roomId,
          nickname,
          is_typing: isTyping,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'room_id,nickname'
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (presenceRef.current) {
      await supabase.removeChannel(presenceRef.current);
      presenceRef.current = null;
    }
    
    setCurrentRoom(null);
    setMessages([]);
    setUsers([]);
    setIsConnected(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentRoom,
    messages,
    users,
    isConnected,
    error,
    createRoom,
    joinRoom,
    sendMessage,
    updateTypingStatus,
    leaveRoom
  };
}