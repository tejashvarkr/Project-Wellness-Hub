/*
  # Add feedback table for user feedback and ratings

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `rating` (integer, 1-5 scale)
      - `feedback` (text)
      - `user_email` (text)
      - `user_name` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on feedback table
    - Add policies for authenticated users to insert their own feedback
    - Allow anonymous feedback submission
*/

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text NOT NULL,
  user_email text,
  user_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Users can insert feedback"
  ON feedback
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);