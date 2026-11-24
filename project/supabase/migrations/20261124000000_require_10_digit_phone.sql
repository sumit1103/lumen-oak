/*
# Require a 10-digit phone number on new enquiries

1. Changes
- Adds a CHECK so new rows must have a phone made of exactly 10 digits.
- NOT VALID keeps older rows (which may have optional / free-form phones) untouched.
*/

ALTER TABLE design_inquiries DROP CONSTRAINT IF EXISTS design_inquiries_phone_10_digits;
ALTER TABLE design_inquiries
  ADD CONSTRAINT design_inquiries_phone_10_digits
  CHECK (phone ~ '^[0-9]{10}$') NOT VALID;
