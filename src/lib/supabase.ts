import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not configured. Please set up your Supabase connection.');
}

// Validate that the URL is a proper Supabase URL format
if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  console.error('Invalid Supabase URL format. Expected format: https://your-project-ref.supabase.co');
}

// Create a mock client if environment variables are missing
const createMockClient = () => ({
  from: () => ({
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    select: () => ({
      eq: () => ({
        gt: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
      })
    }),
    upsert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  }),
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
    subscribe: () => {}
  }),
  removeChannel: () => Promise.resolve(),
  rpc: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
});

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : createMockClient();

export type Database = {
  public: {
    Tables: {
      chat_rooms: {
        Row: {
          id: string;
          pin: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          pin: string;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          pin?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          sender_nickname: string;
          content: string;
          message_type: 'text' | 'image' | 'file';
          file_name: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_nickname: string;
          content: string;
          message_type?: 'text' | 'image' | 'file';
          file_name?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender_nickname?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'file';
          file_name?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
      };
      user_presence: {
        Row: {
          id: string;
          room_id: string;
          nickname: string;
          is_typing: boolean;
          last_seen: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          nickname: string;
          is_typing?: boolean;
          last_seen?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          nickname?: string;
          is_typing?: boolean;
          last_seen?: string;
          created_at?: string;
        };
      };
    };
  };
};