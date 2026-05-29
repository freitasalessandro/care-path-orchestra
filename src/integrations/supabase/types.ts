export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checklist_templates: {
        Row: {
          created_at: string
          id: string
          items: Json
          name: string
          surgery_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          name: string
          surgery_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          name?: string
          surgery_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          name: string
          unit_id: string | null
          updated_at: string
          work_hours: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          unit_id?: string | null
          updated_at?: string
          work_hours?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          unit_id?: string | null
          updated_at?: string
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          collected_at: string | null
          created_at: string
          exam_type: string
          id: string
          patient_cpf: string
          patient_name: string
          received_at: string
          status: string
          updated_at: string
        }
        Insert: {
          collected_at?: string | null
          created_at?: string
          exam_type: string
          id?: string
          patient_cpf: string
          patient_name: string
          received_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          collected_at?: string | null
          created_at?: string
          exam_type?: string
          id?: string
          patient_cpf?: string
          patient_name?: string
          received_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      iose_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          scheduled_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      iose_patients: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          full_name: string
          health_insurance: string | null
          id: string
          observations: string | null
          phone: string | null
          rg: string | null
          sus_card: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          full_name: string
          health_insurance?: string | null
          id?: string
          observations?: string | null
          phone?: string | null
          rg?: string | null
          sus_card?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          health_insurance?: string | null
          id?: string
          observations?: string | null
          phone?: string | null
          rg?: string | null
          sus_card?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      iose_surgery_list: {
        Row: {
          created_at: string
          eye_side: string | null
          id: string
          list_id: string | null
          notes: string | null
          patient_id: string
          priority: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
          surgery_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          eye_side?: string | null
          id?: string
          list_id?: string | null
          notes?: string | null
          patient_id: string
          priority?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          surgery_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          eye_side?: string | null
          id?: string
          list_id?: string | null
          notes?: string | null
          patient_id?: string
          priority?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          surgery_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iose_surgery_list_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "iose_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iose_surgery_list_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "iose_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_attachments: {
        Row: {
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          patient_id: string
          uploaded_at: string
          url: string
        }
        Insert: {
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          patient_id: string
          uploaded_at?: string
          url: string
        }
        Update: {
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          patient_id?: string
          uploaded_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          cpf: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          sus_card: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          sus_card?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          sus_card?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          work_hours: number
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          work_hours?: number
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          work_hours?: number
        }
        Relationships: []
      }
      print_settings: {
        Row: {
          created_at: string
          footer_text: string | null
          header_subtitle: string | null
          header_title: string | null
          id: string
          logo_url: string | null
          show_footer: boolean | null
          show_header: boolean | null
          show_logo: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          footer_text?: string | null
          header_subtitle?: string | null
          header_title?: string | null
          id?: string
          logo_url?: string | null
          show_footer?: boolean | null
          show_header?: boolean | null
          show_logo?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          footer_text?: string | null
          header_subtitle?: string | null
          header_title?: string | null
          id?: string
          logo_url?: string | null
          show_footer?: boolean | null
          show_header?: boolean | null
          show_logo?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      secretariat_settings: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sisapi_archive_files: {
        Row: {
          created_at: string
          department: string | null
          document_id: string | null
          document_type: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          metadata: Json | null
          size_bytes: number | null
          title: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          document_id?: string | null
          document_type?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          size_bytes?: number | null
          title?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          document_id?: string | null
          document_type?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          size_bytes?: number | null
          title?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sisapi_archive_files_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "sisapi_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisapi_archive_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "sisapi_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sisapi_authorities: {
        Row: {
          ativo: boolean
          autoridade_user_id: string
          created_at: string
          id: string
          representante_user_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          autoridade_user_id: string
          created_at?: string
          id?: string
          representante_user_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          autoridade_user_id?: string
          created_at?: string
          id?: string
          representante_user_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sisapi_authorities_autoridade_user_id_fkey"
            columns: ["autoridade_user_id"]
            isOneToOne: false
            referencedRelation: "sisapi_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisapi_authorities_representante_user_id_fkey"
            columns: ["representante_user_id"]
            isOneToOne: false
            referencedRelation: "sisapi_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sisapi_departments: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sisapi_document_templates: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          modules_config: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          modules_config?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          modules_config?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sisapi_document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "sisapi_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sisapi_documents: {
        Row: {
          assigned_to: string | null
          author_id: string
          budget_info: Json | null
          content: string
          created_at: string
          creditor_info: Json | null
          department: string | null
          document_type: string | null
          id: string
          is_signed: boolean | null
          items: Json | null
          metadata: Json | null
          signed_by_user_id: string | null
          status: string | null
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          author_id: string
          budget_info?: Json | null
          content: string
          created_at?: string
          creditor_info?: Json | null
          department?: string | null
          document_type?: string | null
          id?: string
          is_signed?: boolean | null
          items?: Json | null
          metadata?: Json | null
          signed_by_user_id?: string | null
          status?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          author_id?: string
          budget_info?: Json | null
          content?: string
          created_at?: string
          creditor_info?: Json | null
          department?: string | null
          document_type?: string | null
          id?: string
          is_signed?: boolean | null
          items?: Json | null
          metadata?: Json | null
          signed_by_user_id?: string | null
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sisapi_documents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "sisapi_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisapi_documents_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "sisapi_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisapi_documents_signed_by_user_id_fkey"
            columns: ["signed_by_user_id"]
            isOneToOne: false
            referencedRelation: "sisapi_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisapi_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sisapi_document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sisapi_notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      sisapi_profiles: {
        Row: {
          allowed_modules: string[] | null
          created_at: string
          department_id: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          must_change_password: boolean | null
          role_id: string | null
          sector_id: string | null
          signature_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          allowed_modules?: string[] | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          must_change_password?: boolean | null
          role_id?: string | null
          sector_id?: string | null
          signature_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          allowed_modules?: string[] | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          must_change_password?: boolean | null
          role_id?: string | null
          sector_id?: string | null
          signature_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sisapi_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "sisapi_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisapi_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "sisapi_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sisapi_profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sisapi_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sisapi_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      sisapi_sectors: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sisapi_sectors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "sisapi_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sisapi_settings: {
        Row: {
          address: string | null
          city_state: string | null
          cnpj: string | null
          general_settings: Json | null
          id: string
          institution_logo_url: string | null
          institution_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          city_state?: string | null
          cnpj?: string | null
          general_settings?: Json | null
          id?: string
          institution_logo_url?: string | null
          institution_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          city_state?: string | null
          cnpj?: string | null
          general_settings?: Json | null
          id?: string
          institution_logo_url?: string | null
          institution_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          condition: string | null
          cpf: string | null
          created_at: string
          department_id: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          position_id: string | null
          registration_code: string | null
          status: string | null
          updated_at: string
          work_schedule: string | null
        }
        Insert: {
          condition?: string | null
          cpf?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
          position_id?: string | null
          registration_code?: string | null
          status?: string | null
          updated_at?: string
          work_schedule?: string | null
        }
        Update: {
          condition?: string | null
          cpf?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          position_id?: string | null
          registration_code?: string | null
          status?: string | null
          updated_at?: string
          work_schedule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_assignments: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          is_primary: boolean | null
          staff_id: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_primary?: boolean | null
          staff_id?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_primary?: boolean | null
          staff_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      surgeries: {
        Row: {
          checklist: Json
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          request_date: string
          scheduled_date: string | null
          size: string
          status: string
          type: string
          updated_at: string
          waiting_reason: string | null
        }
        Insert: {
          checklist?: Json
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          request_date?: string
          scheduled_date?: string | null
          size: string
          status?: string
          type: string
          updated_at?: string
          waiting_reason?: string | null
        }
        Update: {
          checklist?: Json
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          request_date?: string
          scheduled_date?: string | null
          size?: string
          status?: string
          type?: string
          updated_at?: string
          waiting_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          active: boolean | null
          address: string | null
          cnes: string | null
          created_at: string
          id: string
          name: string
          operating_days: string | null
          operating_hours: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          cnes?: string | null
          created_at?: string
          id?: string
          name: string
          operating_days?: string | null
          operating_hours?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          address?: string | null
          cnes?: string | null
          created_at?: string
          id?: string
          name?: string
          operating_days?: string | null
          operating_hours?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_email: { Args: { user_uuid: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
