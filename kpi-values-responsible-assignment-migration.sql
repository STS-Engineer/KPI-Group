BEGIN;

ALTER TABLE public.kpi_values
  ADD COLUMN IF NOT EXISTS responsible_kpi_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kpi_values_responsible_kpi_id_fkey'
      AND conrelid = 'public.kpi_values'::regclass
  ) THEN
    ALTER TABLE public.kpi_values
      ADD CONSTRAINT kpi_values_responsible_kpi_id_fkey
      FOREIGN KEY (responsible_kpi_id)
      REFERENCES public.responsible_kpis (responsible_kpi_id)
      ON UPDATE NO ACTION
      ON DELETE CASCADE;
  END IF;
END $$;

UPDATE public.kpi_values kv
SET responsible_kpi_id = rk.responsible_kpi_id
FROM public.responsible_kpis rk
WHERE rk.responsible_id = kv.responsible_id
  AND rk.kpi_id = kv.kpi_id
  AND (kv.responsible_kpi_id IS NULL OR kv.responsible_kpi_id <> rk.responsible_kpi_id);

UPDATE public.kpi_values kv
SET
  target_snapshot = COALESCE(kv.target_snapshot, rk.target),
  low_limit_snapshot = COALESCE(kv.low_limit_snapshot, rk.low_limit),
  high_limit_snapshot = COALESCE(kv.high_limit_snapshot, rk.high_limit)
FROM public.responsible_kpis rk
WHERE rk.responsible_kpi_id = kv.responsible_kpi_id
  AND (
    kv.target_snapshot IS NULL
    OR kv.low_limit_snapshot IS NULL
    OR kv.high_limit_snapshot IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_kpi_values_responsible_kpi_id
  ON public.kpi_values (responsible_kpi_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kpi_values_responsible_id_kpi_id_week_key'
      AND conrelid = 'public.kpi_values'::regclass
  ) THEN
    ALTER TABLE public.kpi_values
      ADD CONSTRAINT kpi_values_responsible_id_kpi_id_week_key
      UNIQUE (responsible_id, kpi_id, week);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kpi_values_responsible_kpi_id_week_key'
      AND conrelid = 'public.kpi_values'::regclass
  ) THEN
    ALTER TABLE public.kpi_values
      ADD CONSTRAINT kpi_values_responsible_kpi_id_week_key
      UNIQUE (responsible_kpi_id, week);
  END IF;
END $$;

COMMIT;
