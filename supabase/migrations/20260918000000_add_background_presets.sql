-- Add the user-selectable static premium background preset.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS background_preset text NOT NULL DEFAULT 'classic';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_background_preset_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_background_preset_check
  CHECK (background_preset IN ('classic','aurora-luxe','emerald-sapphire','royal-violet','arctic-amethyst'));
