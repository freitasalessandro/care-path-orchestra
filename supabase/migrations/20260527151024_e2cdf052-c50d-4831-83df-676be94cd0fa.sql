-- Add cnes and operating_hours to units table
ALTER TABLE public.units ADD COLUMN cnes TEXT;
ALTER TABLE public.units ADD COLUMN operating_hours TEXT;
