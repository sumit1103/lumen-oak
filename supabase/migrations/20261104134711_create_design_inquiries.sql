/*
# Create design_inquiries table

1. New Tables
- `design_inquiries`
  - `id` (uuid, primary key)
  - `name` (text, required) - visitor's name
  - `email` (text, required) - visitor's email
  - `phone` (text, optional) - visitor's phone number
  - `room_type` (text, optional) - room the visitor wants designed
  - `message` (text, required) - project details
  - `created_at` (timestamptz) - submission time

2. Security
- Enable RLS on `design_inquiries`.
- Grant INSERT only to `anon` and `authenticated`, so the public website can submit inquiries.
- Only an INSERT policy exists, so visitors cannot read, change, or delete other inquiries.
- The studio reads submissions from the database dashboard.

3. Notes
- This is a public contact form with no sign-in, so no user ownership columns are used.
*/

CREATE TABLE IF NOT EXISTS design_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  room_type text CHECK (room_type IS NULL OR char_length(room_type) <= 100),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE design_inquiries ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON design_inquiries TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_design_inquiries" ON design_inquiries;
CREATE POLICY "anon_insert_design_inquiries" ON design_inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
