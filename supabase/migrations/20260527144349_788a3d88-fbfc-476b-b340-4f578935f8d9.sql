-- Add condition column to staff
ALTER TABLE public.staff ADD COLUMN condition TEXT;

-- Add department_id directly to staff for easier registration
ALTER TABLE public.staff ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Create an index for the department_id
CREATE INDEX idx_staff_department_id ON public.staff(department_id);
