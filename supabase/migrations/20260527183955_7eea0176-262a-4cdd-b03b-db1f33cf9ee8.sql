-- Permitir valores nulos na coluna registration_code
ALTER TABLE public.staff ALTER COLUMN registration_code DROP NOT NULL;

-- Limpar a matrícula do Alessandro Freitas
UPDATE public.staff 
SET registration_code = NULL 
WHERE id = 'd2ca7e92-26c3-4a52-9d6e-7cf356144635';