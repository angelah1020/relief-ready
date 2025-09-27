/*
# Extended Schema for Relief Ready Features

This migration adds tables to support:
- Hazard configurations
- Emergency contacts & rally points  
- AI chat history
- Map preferences & disaster cache
- Enhanced household management
*/

-- Hazard configurations per household
CREATE TABLE IF NOT EXISTS hazard_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  hazard_type text CHECK (hazard_type IN ('hurricane', 'wildfire', 'flood', 'earthquake', 'tornado', 'heat')) NOT NULL,
  enabled boolean DEFAULT true,
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  season_start text, -- e.g., "06-01" for June 1st
  season_end text,   -- e.g., "11-30" for Nov 30th
  auto_detected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(household_id, hazard_type)
);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  relationship text, -- e.g., "aunt", "friend", "neighbor"
  is_primary boolean DEFAULT false,
  is_out_of_area boolean DEFAULT false, -- out-of-area contact for disasters
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rally points (meeting locations)
CREATE TABLE IF NOT EXISTS rally_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- e.g., "Local School", "Community Center"
  address text NOT NULL,
  latitude decimal,
  longitude decimal,
  notes text, -- additional instructions
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI chat conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL, -- user's message
  response text NOT NULL, -- AI response
  session_id uuid NOT NULL, -- group related messages
  message_type text CHECK (message_type IN ('question', 'navigation', 'preparedness')) DEFAULT 'question',
  created_at timestamptz DEFAULT now()
);

-- User map preferences
CREATE TABLE IF NOT EXISTS map_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  center_latitude decimal DEFAULT 39.8283, -- Default to center of US
  center_longitude decimal DEFAULT -98.5795,
  zoom_level integer DEFAULT 6,
  enabled_layers jsonb DEFAULT '["alerts", "earthquakes"]'::jsonb, -- array of enabled layer names
  show_household_location boolean DEFAULT true,
  auto_refresh boolean DEFAULT true,
  refresh_interval integer DEFAULT 300, -- seconds
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cached disaster data from external APIs
CREATE TABLE IF NOT EXISTS disaster_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source text NOT NULL, -- 'nws', 'usgs', 'nasa_firms', etc.
  data_type text NOT NULL,   -- 'alerts', 'earthquakes', 'wildfires', etc.
  region_bounds jsonb,       -- bounding box for the cached data
  geojson_data jsonb NOT NULL, -- the actual GeoJSON data
  metadata jsonb,            -- additional metadata (severity, timestamps, etc.)
  last_updated timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE(data_source, data_type, region_bounds)
);

-- Enhanced members table (add medical consent)
ALTER TABLE members ADD COLUMN IF NOT EXISTS medical_consent boolean DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS emergency_contact_id uuid REFERENCES emergency_contacts(id);

-- Enhanced households table
ALTER TABLE households ADD COLUMN IF NOT EXISTS home_type text CHECK (home_type IN ('apartment', 'house', 'condo', 'mobile', 'other'));
ALTER TABLE households ADD COLUMN IF NOT EXISTS floor_level integer;
ALTER TABLE households ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';

-- Inventory categories enhancement
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS canonical_key text; -- standardized item key for AI mapping
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS ai_confidence decimal; -- confidence in AI categorization
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS expiry_alert_sent boolean DEFAULT false;

-- Checklist items enhancement  
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS formula_used text; -- which calculation formula was used
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS base_quantity integer; -- base amount before household multipliers
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS multiplier_factors jsonb; -- what factors affected the quantity

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hazard_configs_household_id ON hazard_configs(household_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_household_id ON emergency_contacts(household_id);
CREATE INDEX IF NOT EXISTS idx_rally_points_household_id ON rally_points(household_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_household_id ON chat_messages(household_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_map_preferences_user_id ON map_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_disaster_cache_source_type ON disaster_cache(data_source, data_type);
CREATE INDEX IF NOT EXISTS idx_disaster_cache_expires_at ON disaster_cache(expires_at);

-- Add some default hazard configurations for new households
-- This will be handled by application logic when households are created

-- Create a function to initialize default hazard configs
CREATE OR REPLACE FUNCTION initialize_default_hazards(household_uuid uuid, zip_code text)
RETURNS void AS $$
BEGIN
  -- Insert default hazard configurations based on ZIP code
  -- This is a simplified version - in reality, you'd have more sophisticated geo-mapping
  INSERT INTO hazard_configs (household_id, hazard_type, enabled, auto_detected) VALUES
    (household_uuid, 'earthquake', true, true),
    (household_uuid, 'wildfire', true, true),
    (household_uuid, 'flood', true, true),
    (household_uuid, 'tornado', true, true),
    (household_uuid, 'hurricane', true, true),
    (household_uuid, 'heat', true, true)
  ON CONFLICT (household_id, hazard_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-initialize hazards when a household is created
CREATE OR REPLACE FUNCTION auto_init_hazards()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_default_hazards(NEW.id, NEW.zip_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_init_hazards
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION auto_init_hazards();
