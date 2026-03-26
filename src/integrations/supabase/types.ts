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
    PostgrestVersion: "14.4"
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
      affiliate_invites: {
        Row: {
          affiliate_type: string
          commission_first: number | null
          commission_recurring: number | null
          commission_saas_tax: number | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          invite_code: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          affiliate_type?: string
          commission_first?: number | null
          commission_recurring?: number | null
          commission_saas_tax?: number | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          affiliate_type?: string
          commission_first?: number | null
          commission_recurring?: number | null
          commission_saas_tax?: number | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          active_referrals: number | null
          anti_fraud_accepted: boolean | null
          anti_fraud_accepted_at: string | null
          asaas_account_status: string | null
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
          asaas_account_status?: string | null
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
          asaas_account_status?: string | null
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
      ai_config: {
        Row: {
          auto_billing: boolean | null
          auto_booking: boolean | null
          auto_reactivation: boolean | null
          auto_register_client: boolean | null
          barbershop_id: string
          created_at: string
          greeting_message: string | null
          id: string
          language: string
          personality: string
          response_type: string
          updated_at: string
          voice_id: string | null
        }
        Insert: {
          auto_billing?: boolean | null
          auto_booking?: boolean | null
          auto_reactivation?: boolean | null
          auto_register_client?: boolean | null
          barbershop_id: string
          created_at?: string
          greeting_message?: string | null
          id?: string
          language?: string
          personality?: string
          response_type?: string
          updated_at?: string
          voice_id?: string | null
        }
        Update: {
          auto_billing?: boolean | null
          auto_booking?: boolean | null
          auto_reactivation?: boolean | null
          auto_register_client?: boolean | null
          barbershop_id?: string
          created_at?: string
          greeting_message?: string | null
          id?: string
          language?: string
          personality?: string
          response_type?: string
          updated_at?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys_custom: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          key_hash: string
          label: string
          last_used_at: string | null
          owner_id: string
          owner_type: string
          permissions_json: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          key_hash: string
          label: string
          last_used_at?: string | null
          owner_id: string
          owner_type: string
          permissions_json?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          key_hash?: string
          label?: string
          last_used_at?: string | null
          owner_id?: string
          owner_type?: string
          permissions_json?: Json | null
          updated_at?: string
        }
        Relationships: []
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
      automations: {
        Row: {
          action_type: string
          barbershop_id: string
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          barbershop_id: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          barbershop_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          address: string | null
          affiliate_auto_pay: boolean | null
          affiliate_commission_pct: number | null
          affiliate_reward_type: string | null
          asaas_customer_id: string | null
          asaas_wallet_id: string | null
          automation_schedule: Json | null
          booking_policies: Json | null
          cashback_percentage: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          onboarding_status: string | null
          owner_user_id: string
          phone: string | null
          sector: string | null
          slug: string | null
          specialty: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          affiliate_auto_pay?: boolean | null
          affiliate_commission_pct?: number | null
          affiliate_reward_type?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          automation_schedule?: Json | null
          booking_policies?: Json | null
          cashback_percentage?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          onboarding_status?: string | null
          owner_user_id: string
          phone?: string | null
          sector?: string | null
          slug?: string | null
          specialty?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          affiliate_auto_pay?: boolean | null
          affiliate_commission_pct?: number | null
          affiliate_reward_type?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          automation_schedule?: Json | null
          booking_policies?: Json | null
          cashback_percentage?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          onboarding_status?: string | null
          owner_user_id?: string
          phone?: string | null
          sector?: string | null
          slug?: string | null
          specialty?: string | null
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
      client_referrals: {
        Row: {
          barbershop_id: string
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          reward_amount: number | null
          reward_type: string | null
          status: string | null
        }
        Insert: {
          barbershop_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id: string
          reward_amount?: number | null
          reward_type?: string | null
          status?: string | null
        }
        Update: {
          barbershop_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_amount?: number | null
          reward_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_referrals_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reviews: {
        Row: {
          appointment_id: string | null
          barbershop_id: string
          client_user_id: string
          comment: string | null
          created_at: string
          id: string
          is_public: boolean | null
          professional_id: string | null
          rating: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barbershop_id: string
          client_user_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          professional_id?: string | null
          rating: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barbershop_id?: string
          client_user_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          professional_id?: string | null
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          barbershop_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          last_visit_at: string | null
          name: string
          notes: string | null
          tags: string[] | null
          total_spent: number | null
          total_visits: number | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_visit_at?: string | null
          name: string
          notes?: string | null
          tags?: string[] | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_visit_at?: string | null
          name?: string
          notes?: string | null
          tags?: string[] | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount: number
          barbershop_id: string
          client_name: string
          client_user_id: string | null
          client_whatsapp: string | null
          created_at: string
          description: string | null
          id: string
          paid_at: string | null
          payment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          barbershop_id: string
          client_name: string
          client_user_id?: string | null
          client_whatsapp?: string | null
          created_at?: string
          description?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          barbershop_id?: string
          client_name?: string
          client_user_id?: string | null
          client_whatsapp?: string | null
          created_at?: string
          description?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
      fiscal_service_requests: {
        Row: {
          accountant_id: string | null
          amount: number | null
          client_user_id: string
          created_at: string
          description: string | null
          id: string
          notes: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          accountant_id?: string | null
          amount?: number | null
          client_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          accountant_id?: string | null
          amount?: number | null
          client_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_service_requests_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "accountants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_endpoints: {
        Row: {
          active: boolean | null
          created_at: string
          endpoint_url: string
          event_name: string
          headers_json: Json | null
          id: string
          integration_id: string
          method: string
          retry_count: number | null
          retry_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          endpoint_url: string
          event_name: string
          headers_json?: Json | null
          id?: string
          integration_id: string
          method?: string
          retry_count?: number | null
          retry_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          endpoint_url?: string
          event_name?: string
          headers_json?: Json | null
          id?: string
          integration_id?: string
          method?: string
          retry_count?: number | null
          retry_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_endpoints_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
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
      integrations: {
        Row: {
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          base_url: string | null
          config_json: Json | null
          created_at: string
          created_by: string | null
          environment: string
          id: string
          name: string
          provider_name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          base_url?: string | null
          config_json?: Json | null
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          name: string
          provider_name: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          base_url?: string | null
          config_json?: Json | null
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          name?: string
          provider_name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          job_type: string
          last_error: string | null
          max_attempts: number
          payload: Json
          priority: number
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          job_type: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          job_type?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          barbershop_id: string
          created_at: string
          id: string
          level: string
          points: number
          total_earned: number
          total_redeemed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          id?: string
          level?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          id?: string
          level?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          barbershop_id: string
          benefits: Json | null
          cashback_bonus: number | null
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          is_active: boolean | null
          max_members: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          benefits?: Json | null
          cashback_bonus?: number | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          benefits?: Json | null
          cashback_bonus?: number | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_subscriptions: {
        Row: {
          barbershop_id: string
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      message_balance: {
        Row: {
          barbershop_id: string
          channel: string
          id: string
          total_credits: number | null
          updated_at: string
          used_credits: number | null
        }
        Insert: {
          barbershop_id: string
          channel?: string
          id?: string
          total_credits?: number | null
          updated_at?: string
          used_credits?: number | null
        }
        Update: {
          barbershop_id?: string
          channel?: string
          id?: string
          total_credits?: number | null
          updated_at?: string
          used_credits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_balance_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      message_schedules: {
        Row: {
          barbershop_id: string
          channel: string
          created_at: string
          days_of_week: number[]
          id: string
          is_active: boolean | null
          message_template: string
          name: string
          send_time: string
          target_audience: string
          updated_at: string
          use_ai: boolean | null
        }
        Insert: {
          barbershop_id: string
          channel?: string
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_active?: boolean | null
          message_template: string
          name: string
          send_time?: string
          target_audience?: string
          updated_at?: string
          use_ai?: boolean | null
        }
        Update: {
          barbershop_id?: string
          channel?: string
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_active?: boolean | null
          message_template?: string
          name?: string
          send_time?: string
          target_audience?: string
          updated_at?: string
          use_ai?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "message_schedules_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_credits: {
        Row: {
          barbershop_id: string
          channel: string
          id: string
          remaining: number
          total_purchased: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          channel?: string
          id?: string
          remaining?: number
          total_purchased?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          channel?: string
          id?: string
          remaining?: number
          total_purchased?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messaging_credits_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_packages: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          quantity: number
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          quantity: number
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          quantity?: number
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
      pixels: {
        Row: {
          active: boolean | null
          created_at: string
          events_json: Json | null
          id: string
          owner_id: string | null
          owner_type: string
          pixel_id: string
          pixel_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          events_json?: Json | null
          id?: string
          owner_id?: string | null
          owner_type: string
          pixel_id: string
          pixel_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          events_json?: Json | null
          id?: string
          owner_id?: string | null
          owner_type?: string
          pixel_id?: string
          pixel_type?: string
          updated_at?: string
        }
        Relationships: []
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
          bank_info: Json | null
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
          bank_info?: Json | null
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
          bank_info?: Json | null
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
      raffles: {
        Row: {
          barbershop_id: string
          created_at: string
          credit_award: number
          description: string | null
          id: string
          max_tickets: number
          name: string
          status: string
          ticket_price: number
          updated_at: string
          winner_user_id: string | null
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          credit_award?: number
          description?: string | null
          id?: string
          max_tickets?: number
          name: string
          status?: string
          ticket_price?: number
          updated_at?: string
          winner_user_id?: string | null
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          credit_award?: number
          description?: string | null
          id?: string
          max_tickets?: number
          name?: string
          status?: string
          ticket_price?: number
          updated_at?: string
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raffles_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          created_at: string
          id: string
          identifier: string
          max_requests: number
          request_count: number
          window_seconds: number
          window_start: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          identifier: string
          max_requests?: number
          request_count?: number
          window_seconds?: number
          window_start?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          identifier?: string
          max_requests?: number
          request_count?: number
          window_seconds?: number
          window_start?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          id: string
          is_available: boolean | null
          metadata: Json | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean | null
          metadata?: Json | null
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean | null
          metadata?: Json | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_presets: {
        Row: {
          created_at: string
          default_automations: Json | null
          default_policies: Json | null
          default_resources: Json | null
          default_services: Json | null
          display_name: string
          icon: string | null
          id: string
          sector: string
          specialty: string
        }
        Insert: {
          created_at?: string
          default_automations?: Json | null
          default_policies?: Json | null
          default_resources?: Json | null
          default_services?: Json | null
          display_name: string
          icon?: string | null
          id?: string
          sector: string
          specialty: string
        }
        Update: {
          created_at?: string
          default_automations?: Json | null
          default_policies?: Json | null
          default_resources?: Json | null
          default_services?: Json | null
          display_name?: string
          icon?: string | null
          id?: string
          sector?: string
          specialty?: string
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
      social_proofs: {
        Row: {
          barbershop_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
          pages: Json
          type: string
          updated_at: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message: string
          pages?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message?: string
          pages?: Json
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_proofs_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          barbershop_id: string
          buy_price: number
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          quantity: number
          sell_price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          buy_price?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          quantity?: number
          sell_price?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          buy_price?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          quantity?: number
          sell_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_usage: {
        Row: {
          barbershop_id: string
          file_count: number
          id: string
          max_bytes: number
          updated_at: string
          used_bytes: number
        }
        Insert: {
          barbershop_id: string
          file_count?: number
          id?: string
          max_bytes?: number
          updated_at?: string
          used_bytes?: number
        }
        Update: {
          barbershop_id?: string
          file_count?: number
          id?: string
          max_bytes?: number
          updated_at?: string
          used_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "storage_usage_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          barbershop_id: string
          client_user_id: string | null
          created_at: string
          id: string
          payment_method: string | null
          product_id: string | null
          quantity: number | null
          status: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          client_user_id?: string | null
          created_at?: string
          id?: string
          payment_method?: string | null
          product_id?: string | null
          quantity?: number | null
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          client_user_id?: string | null
          created_at?: string
          id?: string
          payment_method?: string | null
          product_id?: string | null
          quantity?: number | null
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          barbershop_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          sales_count: number | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          sales_count?: number | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          sales_count?: number | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_products_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          asaas_checkout_id: string | null
          created_at: string
          duration_months: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          asaas_checkout_id?: string | null
          created_at?: string
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          asaas_checkout_id?: string | null
          created_at?: string
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
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
      waiting_list: {
        Row: {
          barbershop_id: string
          client_id: string | null
          client_user_id: string | null
          confirmed_at: string | null
          created_at: string
          expired_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          preferred_date: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          priority: number | null
          professional_id: string | null
          service_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          client_id?: string | null
          client_user_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          expired_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: number | null
          professional_id?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          client_id?: string | null
          client_user_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          expired_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: number | null
          professional_id?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_log: {
        Row: {
          created_at: string
          event: string
          id: string
          integration_id: string | null
          payload_json: Json | null
          response_body: string | null
          response_code: number | null
          success: boolean | null
          target_url: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          integration_id?: string | null
          payload_json?: Json | null
          response_body?: string | null
          response_code?: number | null
          success?: boolean | null
          target_url: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          integration_id?: string | null
          payload_json?: Json | null
          response_body?: string | null
          response_code?: number | null
          success?: boolean | null
          target_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_log_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_accounts: {
        Row: {
          barbershop_id: string
          created_at: string
          daily_limit: number | null
          display_name: string | null
          id: string
          is_active: boolean | null
          last_reset_at: string | null
          messages_sent_today: number | null
          phone_number: string
          professional_id: string | null
          provider: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          daily_limit?: number | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          last_reset_at?: string | null
          messages_sent_today?: number | null
          phone_number: string
          professional_id?: string | null
          provider?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          daily_limit?: number | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          last_reset_at?: string | null
          messages_sent_today?: number | null
          phone_number?: string
          professional_id?: string | null
          provider?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          account_id: string | null
          barbershop_id: string | null
          client_id: string | null
          content: string | null
          created_at: string
          direction: string
          error_message: string | null
          external_id: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          barbershop_id?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          barbershop_id?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _action_type: string
          _identifier: string
          _max_requests?: number
          _window_seconds?: number
        }
        Returns: boolean
      }
      claim_next_job: {
        Args: { _job_types?: string[] }
        Returns: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          job_type: string
          last_error: string | null
          max_attempts: number
          payload: Json
          priority: number
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "job_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_referral_code: { Args: never; Returns: string }
      get_email_by_whatsapp: { Args: { _whatsapp: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authorized_admin_email: { Args: { _email: string }; Returns: boolean }
      is_authorized_contador: { Args: { _user_id: string }; Returns: boolean }
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
