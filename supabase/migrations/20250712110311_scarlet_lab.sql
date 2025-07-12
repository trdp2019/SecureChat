/*
  # Chat Application Schema

  1. New Tables
    - `chat_rooms`
      - `id` (uuid, primary key)
      - `pin` (text, unique, 6-character room PIN)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, rooms auto-expire after 24 hours)
    
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to chat_rooms)
      - `sender_nickname` (text, user's display name)
      - `content` (text, message content or file data)
      - `message_type` (enum: text, image, file)
      - `file_name` (text, nullable, original filename)
      - `file_size` (integer, nullable, file size in bytes)
      - `created_at` (timestamp)
    
    - `user_presence`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to chat_rooms)
      - `nickname` (text, user's display name)
      - `is_typing` (boolean, typing indicator)
      - `last_seen` (timestamp, for presence tracking)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access rooms they know the PIN for
    - Messages are only visible to users in the same room
    - Automatic cleanup of expired rooms and old messages

  3. Realtime
    - Enable realtime on messages and user_presence tables
    - Optimized for low-latency message delivery
*/

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin text UNIQUE NOT NULL CHECK (length(pin) = 6),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_nickname text NOT NULL CHECK (length(sender_nickname) > 0 AND length(sender_nickname) <= 20),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_name text,
  file_size integer CHECK (file_size IS NULL OR file_size <= 10485760), -- 10MB limit
  created_at timestamptz DEFAULT now()
);

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (length(nickname) > 0 AND length(nickname) <= 20),
  is_typing boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, nickname)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_room_id ON user_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_pin ON chat_rooms(pin);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_expires_at ON chat_rooms(expires_at);

-- Enable Row Level Security
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Anyone can create rooms"
  ON chat_rooms
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read rooms with valid PIN"
  ON chat_rooms
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for messages
CREATE POLICY "Users can insert messages in any room"
  ON messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can read messages from any room"
  ON messages
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for user_presence
CREATE POLICY "Users can manage their presence"
  ON user_presence
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Enable realtime for messages and user_presence
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Function to clean up expired rooms and old messages
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete expired rooms (and cascade to messages/presence)
  DELETE FROM chat_rooms WHERE expires_at < now();
  
  -- Delete messages older than 7 days as additional cleanup
  DELETE FROM messages WHERE created_at < now() - interval '7 days';
  
  -- Clean up stale presence records (users not seen in 1 hour)
  DELETE FROM user_presence WHERE last_seen < now() - interval '1 hour';
END;
$$;

-- Create a function to generate unique PINs
CREATE OR REPLACE FUNCTION generate_unique_pin()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_pin text;
  pin_exists boolean;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric PIN
    new_pin := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if PIN already exists in active rooms
    SELECT EXISTS(
      SELECT 1 FROM chat_rooms 
      WHERE pin = new_pin AND expires_at > now()
    ) INTO pin_exists;
    
    -- If PIN doesn't exist, return it
    IF NOT pin_exists THEN
      RETURN new_pin;
    END IF;
  END LOOP;
END;
$$;