-- Create units table (UBS)
CREATE TABLE public.units (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage units" ON public.units FOR ALL TO authenticated USING (true);

-- Create departments table
CREATE TABLE public.departments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage departments" ON public.departments FOR ALL TO authenticated USING (true);

-- Create staff table
CREATE TABLE public.staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    position TEXT,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage staff" ON public.staff FOR ALL TO authenticated USING (true);

-- Create staff_assignments to link staff to units and departments
CREATE TABLE public.staff_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_assignments TO authenticated;
GRANT ALL ON public.staff_assignments TO service_role;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage staff assignments" ON public.staff_assignments FOR ALL TO authenticated USING (true);
