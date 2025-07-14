/*
  # Fix reply_to column type by removing foreign key constraint

  1. Schema Changes
    - Drop the foreign key constraint on reply_to column
    - Change reply_to column type from UUID to TEXT
    - This allows storing JSON strings for reply data instead of UUID references

  2. Security
    - No RLS changes needed (inherits from existing policies)
*/

-- Drop the foreign key constraint on reply_to column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_reply_to_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_reply_to_fkey;
  END IF;
END $$;

-- Change reply_to column type from UUID to TEXT
ALTER TABLE messages 
ALTER COLUMN reply_to TYPE text 
USING reply_to::text;
