-- New private data only. Existing tables, RLS, checkout and delivery remain unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS public.teaching_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  class_name text NOT NULL DEFAULT '' CHECK (char_length(class_name)<=100),
  subject text NOT NULL DEFAULT '' CHECK (char_length(subject)<=100),
  lesson_date date,
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes)<=6000),
  materials jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(materials)='array' AND jsonb_array_length(materials)<=30),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teaching_plans_user_idx ON public.teaching_plans(user_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS public.material_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL CHECK (char_length(question) BETWEEN 10 AND 1000),
  answer text CHECK (char_length(answer) BETWEEN 3 AND 2000),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);
CREATE INDEX IF NOT EXISTS material_questions_product_idx ON public.material_questions(product_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.material_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  filters jsonb NOT NULL CHECK (jsonb_typeof(filters)='object'),
  notifications_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS material_saved_searches_user_idx ON public.material_saved_searches(user_id);
CREATE TABLE IF NOT EXISTS public.creator_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  question text NOT NULL CHECK (char_length(question) BETWEEN 10 AND 240),
  options jsonb NOT NULL CHECK (jsonb_typeof(options)='array' AND jsonb_array_length(options) BETWEEN 2 AND 5),
  closes_at timestamptz NOT NULL,
  closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_polls_store_idx ON public.creator_polls(store_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.creator_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.creator_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index integer NOT NULL CHECK (option_index BETWEEN 0 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id,user_id)
);
ALTER TABLE public.teaching_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_poll_votes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.teaching_plans,public.material_questions,public.material_saved_searches,public.creator_polls,public.creator_poll_votes FROM anon,authenticated;
GRANT ALL ON public.teaching_plans,public.material_questions,public.material_saved_searches,public.creator_polls,public.creator_poll_votes TO service_role;
-- Aggregate results only. Never expose the identities of voters.
CREATE OR REPLACE FUNCTION public.teaching_poll_results(p_ids uuid[])
RETURNS TABLE(poll_id uuid,option_index integer,votes bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT v.poll_id,v.option_index,count(*) FROM public.creator_poll_votes v
  WHERE v.poll_id=ANY(p_ids) GROUP BY v.poll_id,v.option_index;
$$;
REVOKE ALL ON FUNCTION public.teaching_poll_results(uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.teaching_poll_results(uuid[]) TO service_role;
-- A row lock makes closing and voting mutually consistent; duplicate votes are impossible.
CREATE OR REPLACE FUNCTION public.teaching_poll_vote(p_id uuid,p_user uuid,p_option integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE p public.creator_polls;
BEGIN
  SELECT * INTO p FROM public.creator_polls WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p.closed OR p.closes_at<=now() THEN RAISE EXCEPTION 'Enquete encerrada'; END IF;
  IF p_option<0 OR p_option>=jsonb_array_length(p.options) THEN RAISE EXCEPTION 'Opcao invalida'; END IF;
  IF EXISTS(SELECT 1 FROM public.stores WHERE id=p.store_id AND creator_id=p_user) THEN RAISE EXCEPTION 'O autor nao pode votar'; END IF;
  INSERT INTO public.creator_poll_votes(poll_id,user_id,option_index) VALUES(p_id,p_user,p_option);
END;
$$;
REVOKE ALL ON FUNCTION public.teaching_poll_vote(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.teaching_poll_vote(uuid,uuid,integer) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
