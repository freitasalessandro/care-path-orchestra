-- Grant permissions for iose_patients
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iose_patients TO authenticated;
GRANT ALL ON public.iose_patients TO service_role;

-- Grant permissions for iose_surgery_list
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iose_surgery_list TO authenticated;
GRANT ALL ON public.iose_surgery_list TO service_role;