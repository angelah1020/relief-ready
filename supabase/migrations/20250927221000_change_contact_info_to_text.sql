-- Change contact_info column from numeric to text to support formatted phone numbers
ALTER TABLE members ALTER COLUMN contact_info TYPE text;
