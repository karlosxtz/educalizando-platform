BEGIN;
ALTER TABLE public.creator_clubs ADD COLUMN IF NOT EXISTS club_type text NOT NULL DEFAULT 'final';
ALTER TABLE public.creator_clubs DROP CONSTRAINT IF EXISTS creator_clubs_type_check;
ALTER TABLE public.creator_clubs ADD CONSTRAINT creator_clubs_type_check CHECK (club_type IN ('final', 'plr'));

-- Protect PLR collections even when material links are written directly.
CREATE OR REPLACE FUNCTION public.validate_creator_club_plr_material()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.creator_clubs WHERE id = NEW.club_id AND club_type = 'plr')
     AND NOT EXISTS (SELECT 1 FROM public.products WHERE id = NEW.product_id AND is_plr = true) THEN
    RAISE EXCEPTION 'Clubes PLR aceitam apenas materiais com licença PLR.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_creator_club_plr_material ON public.creator_club_materials;
CREATE TRIGGER validate_creator_club_plr_material BEFORE INSERT OR UPDATE ON public.creator_club_materials
FOR EACH ROW EXECUTE FUNCTION public.validate_creator_club_plr_material();

-- Keep the license purchased by existing members unchanged.
CREATE OR REPLACE FUNCTION public.preserve_creator_club_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.club_type IS DISTINCT FROM OLD.club_type THEN
    RAISE EXCEPTION 'Crie um novo clube para oferecer outro tipo de licença.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS preserve_creator_club_type ON public.creator_clubs;
CREATE TRIGGER preserve_creator_club_type BEFORE UPDATE OF club_type ON public.creator_clubs
FOR EACH ROW EXECUTE FUNCTION public.preserve_creator_club_type();
COMMIT;
