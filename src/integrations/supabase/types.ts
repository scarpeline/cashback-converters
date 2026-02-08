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
      accountants: {
        Row: {
          asaas_customer_id: string | null
          asaas_wallet_id: string | null
          commission_declaration: number | null
          commission_me: number | null
          commission_mei: number | null
          cpf_cnpj: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          commission_declaration?: number | null
          commission_me?: number | null
          commission_mei?: number | null
          cpf_cnpj?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          commission_declaration?: number | null
          commission_me?: number | null
          commission_mei?: number | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          percentage_applied: number
          source_id: string | null
          source_type: string
          status: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          percentage_applied: number
          source_id?: string | null
          source_type: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          percentage_applied?: number
          source_id?: string | null
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          active_referrals: number | null
          anti_fraud_accepted: boolean | null
          anti_fraud_accepted_at: string | null
          asaas_customer_id: string | null
          asaas_wallet_id: string | null
          barbershop_id: string | null
          commission_first: number | null
          commission_recurring: number | null
          commission_saas_tax: number | null
          created_at: string
          id: string
          is_active: boolean | null
          parent_affiliate_id: string | null
          pending_earnings: number | null
          referral_code: string
          total_earnings: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_referrals?: number | null
          anti_fraud_accepted?: boolean | null
          anti_fraud_accepted_at?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          barbershop_id?: string | null
          commission_first?: number | null
          commission_recurring?: number | null
          commission_saas_tax?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          parent_affiliate_id?: string | null
          pending_earnings?: number | null
          referral_code: string
          total_earnings?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_referrals?: number | null
          anti_fraud_accepted?: boolean | null
          anti_fraud_accepted_at?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          barbershop_id?: string | null
          commission_first?: number | null
          commission_recurring?: number | null
          commission_saas_tax?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          parent_affiliate_id?: string | null
          pending_earnings?: number | null
          referral_code?: string
          total_earnings?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_parent_affiliate_id_fkey"
            columns: ["parent_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      app_environment: {
        Row: {
          current_env: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          current_env?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          current_env?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          barbershop_id: string
          client_name: string | null
          client_user_id: string | null
          client_whatsapp: string | null
          created_at: string
          id: string
          notes: string | null
          professional_id: string
          scheduled_at: string
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          client_name?: string | null
          client_user_id?: string | null
          client_whatsapp?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          professional_id: string
          scheduled_at: string
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          client_name?: string | null
          client_user_id?: string | null
          client_whatsapp?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          professional_id?: string
          scheduled_at?: string
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_super_admins: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      barbershops: {
        Row: {
          address: string | null
          asaas_customer_id: string | null
          asaas_wallet_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          owner_user_id: string
          phone: string | null
          slug: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          owner_user_id: string
          phone?: string | null
          slug?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          phone?: string | null
          slug?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cashback_credits: {
        Row: {
          amount: number
          barbershop_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          source: string
          source_id: string | null
          used_amount: number | null
          user_id: string
        }
        Insert: {
          amount: number
          barbershop_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          source: string
          source_id?: string | null
          used_amount?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          barbershop_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          source?: string
          source_id?: string | null
          used_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashback_credits_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_records: {
        Row: {
          accountant_id: string | null
          amount: number
          completed_at: string | null
          created_at: string
          data: Json | null
          entity_type: string
          entity_user_id: string | null
          id: string
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          accountant_id?: string | null
          amount: number
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          entity_type: string
          entity_user_id?: string | null
          id?: string
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          accountant_id?: string | null
          amount?: number
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          entity_type?: string
          entity_user_id?: string | null
          id?: string
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_records_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "accountants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          created_at: string
          environment: string
          error_message: string | null
          event_type: string
          id: string
          request_data: Json | null
          response_data: Json | null
          service: string
          status: string | null
        }
        Insert: {
          created_at?: string
          environment: string
          error_message?: string | null
          event_type: string
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          service: string
          status?: string | null
        }
        Update: {
          created_at?: string
          environment?: string
          error_message?: string | null
          event_type?: string
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          service?: string
          status?: string | null
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          api_key_hash: string | null
          base_url: string | null
          created_at: string
          environment: string
          from_email: string | null
          id: string
          is_active: boolean | null
          service_name: string
          updated_at: string
          webhook_secret_hash: string | null
        }
        Insert: {
          api_key_hash?: string | null
          base_url?: string | null
          created_at?: string
          environment?: string
          from_email?: string | null
          id?: string
          is_active?: boolean | null
          service_name: string
          updated_at?: string
          webhook_secret_hash?: string | null
        }
        Update: {
          api_key_hash?: string | null
          base_url?: string | null
          created_at?: string
          environment?: string
          from_email?: string | null
          id?: string
          is_active?: boolean | null
          service_name?: string
          updated_at?: string
          webhook_secret_hash?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          priority: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          asaas_payment_id: string | null
          asaas_pix_copy_paste: string | null
          asaas_pix_qr_code: string | null
          barbershop_id: string
          client_user_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          payment_method: string
          split_data: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          asaas_payment_id?: string | null
          asaas_pix_copy_paste?: string | null
          asaas_pix_qr_code?: string | null
          barbershop_id: string
          client_user_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method: string
          split_data?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          asaas_payment_id?: string | null
          asaas_pix_copy_paste?: string | null
          asaas_pix_qr_code?: string | null
          barbershop_id?: string
          client_user_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string
          split_data?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_configurations: {
        Row: {
          barbershop_id: string | null
          created_at: string
          events: Json | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          pixel_id: string
          platform: string
          updated_at: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          events?: Json | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          pixel_id: string
          platform: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
          events?: Json | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          pixel_id?: string
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_configurations_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          asaas_customer_id: string | null
          asaas_wallet_id: string | null
          barbershop_id: string
          commission_percentage: number | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          pix_key: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          barbershop_id: string
          commission_percentage?: number | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pix_key?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          barbershop_id?: string
          commission_percentage?: number | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pix_key?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          pix_key: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          pix_key?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          pix_key?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chats: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          is_from_support: boolean | null
          message: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          is_from_support?: boolean | null
          message: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          is_from_support?: boolean | null
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      owns_barbershop: {
        Args: { _barbershop_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "cliente"
        | "dono"
        | "profissional"
        | "afiliado_barbearia"
        | "afiliado_saas"
        | "contador"
        | "super_admin"
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
    Enums: {
      app_role: [
        "cliente",
        "dono",
        "profissional",
        "afiliado_barbearia",
        "afiliado_saas",
        "contador",
        "super_admin",
      ],
    },
  },
} as const
