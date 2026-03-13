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
          crc_registro: string | null
          empresa_contabil: string | null
          endereco: string | null
          cidade: string | null
          estado: string | null
          telefone: string | null
          status_verificado: string
          bio: string | null
          avatar_url: string | null
          aceita_novos_clientes: boolean
          valor_mensalidade: number | null
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
          crc_registro?: string | null
          empresa_contabil?: string | null
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          telefone?: string | null
          status_verificado?: string
          bio?: string | null
          avatar_url?: string | null
          aceita_novos_clientes?: boolean
          valor_mensalidade?: number | null
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
          crc_registro?: string | null
          empresa_contabil?: string | null
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          telefone?: string | null
          status_verificado?: string
          bio?: string | null
          avatar_url?: string | null
          aceita_novos_clientes?: boolean
          valor_mensalidade?: number | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          id: string
          barbershop_id: string
          date: string
          revenue: number
          services_count: number
          appointments_count: number
          clients_count: number
          cash_revenue: number
          pix_revenue: number
          card_revenue: number
          commission_total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          date: string
          revenue?: number
          services_count?: number
          appointments_count?: number
          clients_count?: number
          cash_revenue?: number
          pix_revenue?: number
          card_revenue?: number
          commission_total?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          date?: string
          revenue?: number
          services_count?: number
          appointments_count?: number
          clients_count?: number
          cash_revenue?: number
          pix_revenue?: number
          card_revenue?: number
          commission_total?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      professional_commissions: {
        Row: {
          id: string
          professional_id: string
          appointment_id: string
          payment_id: string
          commission_percent: number
          commission_amount: number
          total_amount: number
          status: string
          paid_at: string | null
          created_at: string
          updated_at: string
          update_accountant_comissions: {
            Args: {
              p_accountant_id: string
              p_commission_mei: number
              p_commission_me: number
              p_commission_declaration: number
            }
            Returns: void
          }
          update_daily_metrics: {
            Args: {
              p_barbershop_id: string
              p_date: string
              p_revenue?: number
              p_services_count?: number
              p_appointments_count?: number
              p_clients_count?: number
              p_cash_revenue?: number
              p_pix_revenue?: number
              p_card_revenue?: number
              p_commission_total?: number
            }
            Returns: void
          }
          calculate_professional_commission: {
            Args: {
              p_professional_id: string
              p_appointment_id: string
              p_payment_id: string
              p_total_amount: number
            }
            Returns: {
              commission_percent: number
              commission_amount: number
              success: boolean
              message: string
            }[]
          }
          get_pending_commissions: {
            Args: {
              p_professional_id: string
            }
            Returns: {
              id: string
              appointment_id: string
              payment_id: string
              commission_percent: number
              commission_amount: number
              total_amount: number
              created_at: string
            }[]
          }
          create_post_appointment_notification: {
            Args: {
              p_appointment_id: string
              p_professional_id: string
              p_notification_type: string
            }
            Returns: string
          }
          log_webhook_execution: {
            Args: {
              p_webhook_config_id: string
              p_event_type: string
              p_payload?: Json
              p_response_status?: number
              p_response_body?: string
              p_error_message?: string
              p_duration_ms?: number
            }
            Returns: void
          }
          get_active_webhooks: {
            Args: Record<PropertyKey, never>
            Returns: {
              id: string
              service_name: string
              webhook_url: string
              webhook_secret: string
              last_triggered: string | null
              last_success: string | null
            }[]
          }
          test_webhook: {
            Args: {
              p_webhook_config_id: string
            }
            Returns: {
              success: boolean
              status_code: number
              response_text: string
              duration_ms: number
            }[]
          }
        }
        Insert: {
          id?: string
          professional_id: string
          appointment_id: string
          payment_id: string
          commission_percent: number
          commission_amount: number
          total_amount: number
          status?: string
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          appointment_id?: string
          payment_id?: string
          commission_percent?: number
          commission_amount?: number
          total_amount?: number
          status?: string
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          }
        ]
      }
      post_appointment_notifications: {
        Row: {
          id: string
          appointment_id: string
          professional_id: string
          notification_type: string
          sent_at: string | null
          acknowledged_at: string | null
          action_taken: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          professional_id: string
          notification_type: string
          sent_at?: string | null
          acknowledged_at?: string | null
          action_taken?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          professional_id?: string
          notification_type?: string
          sent_at?: string | null
          acknowledged_at?: string | null
          action_taken?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_appointment_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_appointment_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      webhook_configs: {
        Row: {
          id: string
          service_name: string
          webhook_url: string
          webhook_secret: string
          is_active: boolean
          last_triggered: string | null
          last_success: string | null
          last_error: string | null
          retry_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_name: string
          webhook_url: string
          webhook_secret?: string
          is_active?: boolean
          last_triggered?: string | null
          last_success?: string | null
          last_error?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_name?: string
          webhook_url?: string
          webhook_secret?: string
          is_active?: boolean
          last_triggered?: string | null
          last_success?: string | null
          last_error?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          id: string
          webhook_config_id: string
          event_type: string
          payload: Json
          response_status: number | null
          response_body: string | null
          error_message: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          webhook_config_id: string
          event_type: string
          payload?: Json
          response_status?: number | null
          response_body?: string | null
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          webhook_config_id?: string
          event_type?: string
          payload?: Json
          response_status?: number | null
          response_body?: string | null
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          }
        ]
      }
      accountant_barbershop_links: {
        Row: {
          id: string
          barbershop_id: string
          accountant_id: string
          status: string
          requested_by_user_id: string
          requested_at: string
          accepted_at: string | null
          revoked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          accountant_id: string
          status?: string
          requested_by_user_id: string
          requested_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          accountant_id?: string
          status?: string
          requested_by_user_id?: string
          requested_at?: string
          accepted_at?: string | null
          revoked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounting_audit_logs: {
        Row: {
          id: string
          barbershop_id: string | null
          actor_user_id: string
          actor_role: string | null
          action: string
          entity_table: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id?: string | null
          actor_user_id: string
          actor_role?: string | null
          action: string
          entity_table?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string | null
          actor_user_id?: string
          actor_role?: string | null
          action?: string
          entity_table?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      accounting_documents: {
        Row: {
          id: string
          barbershop_id: string | null
          owner_user_id: string
          accountant_id: string | null
          fiscal_service_request_id: string | null
          title: string
          doc_type: string
          storage_bucket: string
          storage_path: string
          mime_type: string | null
          file_size_bytes: number | null
          is_company_document: boolean
          status: string
          uploaded_by_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id?: string | null
          owner_user_id: string
          accountant_id?: string | null
          fiscal_service_request_id?: string | null
          title: string
          doc_type?: string
          storage_bucket?: string
          storage_path: string
          mime_type?: string | null
          file_size_bytes?: number | null
          is_company_document?: boolean
          status?: string
          uploaded_by_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string | null
          owner_user_id?: string
          accountant_id?: string | null
          fiscal_service_request_id?: string | null
          title?: string
          doc_type?: string
          storage_bucket?: string
          storage_path?: string
          mime_type?: string | null
          file_size_bytes?: number | null
          is_company_document?: boolean
          status?: string
          uploaded_by_user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounting_messages: {
        Row: {
          id: string
          barbershop_id: string | null
          accountant_id: string | null
          sender_user_id: string
          sender_role: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          barbershop_id?: string | null
          accountant_id?: string | null
          sender_user_id: string
          sender_role?: string | null
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string | null
          accountant_id?: string | null
          sender_user_id?: string
          sender_role?: string | null
          body?: string
          created_at?: string
        }
        Relationships: []
      }
      accounting_tax_guides: {
        Row: {
          id: string
          barbershop_id: string
          accountant_id: string | null
          tax_type: string
          reference_period: string | null
          due_date: string | null
          amount: number | null
          status: string
          guide_document_id: string | null
          notes: string | null
          created_by_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          accountant_id?: string | null
          tax_type?: string
          reference_period?: string | null
          due_date?: string | null
          amount?: number | null
          status?: string
          guide_document_id?: string | null
          notes?: string | null
          created_by_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          accountant_id?: string | null
          tax_type?: string
          reference_period?: string | null
          due_date?: string | null
          amount?: number | null
          status?: string
          guide_document_id?: string | null
          notes?: string | null
          created_by_user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_service_types: {
        Row: {
          id: string
          service_type: string
          label: string
          price: number
          required_fields: Json
          is_active: boolean | null
          status: string
          proposed_price: number | null
          proposed_required_fields: Json | null
          proposed_by: string | null
          proposed_at: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_type: string
          label: string
          price?: number
          required_fields?: Json
          is_active?: boolean | null
          status?: string
          proposed_price?: number | null
          proposed_required_fields?: Json | null
          proposed_by?: string | null
          proposed_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_type?: string
          label?: string
          price?: number
          required_fields?: Json
          is_active?: boolean | null
          status?: string
          proposed_price?: number | null
          proposed_required_fields?: Json | null
          proposed_by?: string | null
          proposed_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      config_comissoes: {
        Row: {
          id: string
          porcentagem_app: number
          porcentagem_contador: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          porcentagem_app?: number
          porcentagem_contador?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          porcentagem_app?: number
          porcentagem_contador?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pedidos_contabeis: {
        Row: {
          id: string
          usuario_id: string
          contador_id: string
          servico_id: string | null
          nome_servico: string
          dados_formulario: Json
          valor: number
          status: string
          pagamento_status: string
          asaas_payment_id: string | null
          pix_qr_code: string | null
          pix_copy_paste: string | null
          payment_link: string | null
          porcentagem_app: number
          porcentagem_contador: number
          valor_app: number
          valor_contador: number
          notas: string | null
          data_pedido: string
          data_pagamento: string | null
          data_conclusao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          contador_id: string
          servico_id?: string | null
          nome_servico: string
          dados_formulario?: Json
          valor?: number
          status?: string
          pagamento_status?: string
          asaas_payment_id?: string | null
          pix_qr_code?: string | null
          pix_copy_paste?: string | null
          payment_link?: string | null
          porcentagem_app?: number
          porcentagem_contador?: number
          valor_app?: number
          valor_contador?: number
          notas?: string | null
          data_pedido?: string
          data_pagamento?: string | null
          data_conclusao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          contador_id?: string
          servico_id?: string | null
          nome_servico?: string
          dados_formulario?: Json
          valor?: number
          status?: string
          pagamento_status?: string
          asaas_payment_id?: string | null
          pix_qr_code?: string | null
          pix_copy_paste?: string | null
          payment_link?: string | null
          porcentagem_app?: number
          porcentagem_contador?: number
          valor_app?: number
          valor_contador?: number
          notas?: string | null
          data_pedido?: string
          data_pagamento?: string | null
          data_conclusao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assinaturas_contabeis: {
        Row: {
          id: string
          usuario_id: string
          contador_id: string
          valor_mensal: number
          status: string
          data_inicio: string
          data_proxima_cobranca: string
          data_cancelamento: string | null
          asaas_subscription_id: string | null
          porcentagem_app: number
          porcentagem_contador: number
          valor_app: number
          valor_contador: number
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          contador_id: string
          valor_mensal: number
          status?: string
          data_inicio?: string
          data_proxima_cobranca: string
          data_cancelamento?: string | null
          asaas_subscription_id?: string | null
          porcentagem_app?: number
          porcentagem_contador?: number
          valor_app?: number
          valor_contador?: number
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          contador_id?: string
          valor_mensal?: number
          status?: string
          data_inicio?: string
          data_proxima_cobranca?: string
          data_cancelamento?: string | null
          asaas_subscription_id?: string | null
          porcentagem_app?: number
          porcentagem_contador?: number
          valor_app?: number
          valor_contador?: number
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico_assinaturas: {
        Row: {
          id: string
          assinatura_id: string
          usuario_id: string
          valor: number
          status: string
          asaas_payment_id: string | null
          pix_qr_code: string | null
          pix_copy_paste: string | null
          data_vencimento: string
          data_pagamento: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assinatura_id: string
          usuario_id: string
          valor: number
          status?: string
          asaas_payment_id?: string | null
          pix_qr_code?: string | null
          pix_copy_paste?: string | null
          data_vencimento: string
          data_pagamento?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assinatura_id?: string
          usuario_id?: string
          valor?: number
          status?: string
          asaas_payment_id?: string | null
          pix_qr_code?: string | null
          pix_copy_paste?: string | null
          data_vencimento?: string
          data_pagamento?: string | null
          created_at?: string
        }
        Relationships: []
      }
      chat_contador: {
        Row: {
          id: string
          usuario_id: string
          contador_id: string
          mensagem: string
          remetente: string
          lido: boolean
          data_envio: string
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          contador_id: string
          mensagem: string
          remetente: string
          lido?: boolean
          data_envio?: string
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          contador_id?: string
          mensagem?: string
          remetente?: string
          lido?: boolean
          data_envio?: string
          created_at?: string
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
      barbershops: {
        Row: {
          address: string | null
          affiliate_auto_pay: boolean | null
          affiliate_commission_pct: number | null
          affiliate_reward_type: string | null
          asaas_customer_id: string | null
          asaas_wallet_id: string | null
          automation_schedule: Json | null
          cashback_percentage: number | null
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
          affiliate_auto_pay?: boolean | null
          affiliate_commission_pct?: number | null
          affiliate_reward_type?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          automation_schedule?: Json | null
          cashback_percentage?: number | null
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
          affiliate_auto_pay?: boolean | null
          affiliate_commission_pct?: number | null
          affiliate_reward_type?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          automation_schedule?: Json | null
          cashback_percentage?: number | null
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
      subscription_plans: {
        Row: {
          asaas_checkout_id: string | null
          created_at: string
          duration_months: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          show_on_landing: boolean
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
          show_on_landing?: boolean
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
          show_on_landing?: boolean
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
      automation_blocked_logs: {
        Row: {
          appointment_ids: string[]
          automation_type: string
          barbershop_id: string | null
          block_reason: string
          client_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          appointment_ids?: string[]
          automation_type: string
          barbershop_id?: string | null
          block_reason: string
          client_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          appointment_ids?: string[]
          automation_type?: string
          barbershop_id?: string | null
          block_reason?: string
          client_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_blocked_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_blocked_logs_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlist_queue: {
        Row: {
          id: string
          barbershop_id: string
          client_id: string
          professional_preferred_id: string | null
          service_id: string
          desired_date: string
          desired_time: string
          accepts_other_professional: boolean
          accepts_nearby_time: boolean
          accepts_any_time: boolean
          position_in_queue: number
          status: "waiting" | "offered" | "accepted" | "declined" | "expired" | "cancelled"
          offered_at: string | null
          offered_appointment_id: string | null
          response_deadline: string | null
          responded_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          client_id: string
          professional_preferred_id?: string | null
          service_id: string
          desired_date: string
          desired_time: string
          accepts_other_professional?: boolean
          accepts_nearby_time?: boolean
          accepts_any_time?: boolean
          position_in_queue?: number
          status?: "waiting" | "offered" | "accepted" | "declined" | "expired" | "cancelled"
          offered_at?: string | null
          offered_appointment_id?: string | null
          response_deadline?: string | null
          responded_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          client_id?: string
          professional_preferred_id?: string | null
          service_id?: string
          desired_date?: string
          desired_time?: string
          accepts_other_professional?: boolean
          accepts_nearby_time?: boolean
          accepts_any_time?: boolean
          position_in_queue?: number
          status?: "waiting" | "offered" | "accepted" | "declined" | "expired" | "cancelled"
          offered_at?: string | null
          offered_appointment_id?: string | null
          response_deadline?: string | null
          responded_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_queue_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_queue_professional_preferred_id_fkey"
            columns: ["professional_preferred_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_queue_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_queue_offered_appointment_id_fkey"
            columns: ["offered_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          }
        ]
      }
      agenda_intelligence_settings: {
        Row: {
          id: string
          barbershop_id: string
          enable_waitlist: boolean
          allow_professionals_view_queue: boolean
          allow_professionals_offer_slots: boolean
          waitlist_response_minutes: number
          enable_auto_anticipation: boolean
          anticipation_time_window_hours: number
          allow_professionals_view_anticipations: boolean
          enable_dynamic_pricing: boolean
          allow_professionals_view_dynamic_pricing: boolean
          enable_reallocation: boolean
          allow_professionals_reallocation: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          enable_waitlist?: boolean
          allow_professionals_view_queue?: boolean
          allow_professionals_offer_slots?: boolean
          waitlist_response_minutes?: number
          enable_auto_anticipation?: boolean
          anticipation_time_window_hours?: number
          allow_professionals_view_anticipations?: boolean
          enable_dynamic_pricing?: boolean
          allow_professionals_view_dynamic_pricing?: boolean
          enable_reallocation?: boolean
          allow_professionals_reallocation?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          enable_waitlist?: boolean
          allow_professionals_view_queue?: boolean
          allow_professionals_offer_slots?: boolean
          waitlist_response_minutes?: number
          enable_auto_anticipation?: boolean
          anticipation_time_window_hours?: number
          allow_professionals_view_anticipations?: boolean
          enable_dynamic_pricing?: boolean
          allow_professionals_view_dynamic_pricing?: boolean
          enable_reallocation?: boolean
          allow_professionals_reallocation?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_intelligence_settings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          }
        ]
      }
      dynamic_pricing: {
        Row: {
          id: string
          barbershop_id: string
          service_id: string | null
          day_of_week: number
          start_time: string
          end_time: string
          price_type: "percentage" | "fixed"
          price_adjustment: number
          is_active: boolean
          min_capacity_threshold: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barbershop_id: string
          service_id?: string | null
          day_of_week: number
          start_time: string
          end_time: string
          price_type?: "percentage" | "fixed"
          price_adjustment: number
          is_active?: boolean
          min_capacity_threshold?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barbershop_id?: string
          service_id?: string | null
          day_of_week?: number
          start_time?: string
          end_time?: string
          price_type?: "percentage" | "fixed"
          price_adjustment?: number
          is_active?: boolean
          min_capacity_threshold?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_pricing_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_pricing_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlist_offer_history: {
        Row: {
          id: string
          waitlist_id: string
          appointment_id: string | null
          offer_type: "slot_available" | "anticipation" | "reallocation"
          offered_at: string
          response_deadline: string
          response: "accepted" | "declined" | "expired" | null
          responded_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          waitlist_id: string
          appointment_id?: string | null
          offer_type: "slot_available" | "anticipation" | "reallocation"
          offered_at?: string
          response_deadline: string
          response?: "accepted" | "declined" | "expired" | null
          responded_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          waitlist_id?: string
          appointment_id?: string | null
          offer_type?: "slot_available" | "anticipation" | "reallocation"
          offered_at?: string
          response_deadline?: string
          response?: "accepted" | "declined" | "expired" | null
          responded_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_offer_history_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_offer_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          }
        ]
      }
      anticipation_offers: {
        Row: {
          id: string
          appointment_id: string
          client_id: string
          original_scheduled_at: string
          offered_scheduled_at: string
          status: "pending" | "accepted" | "declined" | "expired"
          offered_at: string
          response_deadline: string
          responded_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          client_id: string
          original_scheduled_at: string
          offered_scheduled_at: string
          status?: "pending" | "accepted" | "declined" | "expired"
          offered_at?: string
          response_deadline: string
          responded_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          client_id?: string
          original_scheduled_at?: string
          offered_scheduled_at?: string
          status?: "pending" | "accepted" | "declined" | "expired"
          offered_at?: string
          response_deadline?: string
          response?: "pending" | "accepted" | "declined" | "expired" | null
          responded_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anticipation_offers_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anticipation_offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
      search_contadores_verificados: {
        Args: { _search?: string }
        Returns: {
          id: string
          name: string
          email: string
          whatsapp: string | null
          crc_registro: string | null
          empresa_contabil: string | null
          cidade: string | null
          estado: string | null
          valor_mensalidade: number | null
          aceita_novos_clientes: boolean
        }[]
      }
      calcular_split_comissao: {
        Args: { _valor: number }
        Returns: { valor_app: number; valor_contador: number; pct_app: number; pct_contador: number }[]
      }
      count_unread_chat_contador: {
        Args: { _contador_id: string }
        Returns: number
      }
      get_accountant_id_by_email: {
        Args: { _email: string }
        Returns: string
      }
      has_active_accountant_link: {
        Args: { _user_id: string; _barbershop_id: string }
        Returns: boolean
      }
      calculate_monthly_revenue: {
        Args: { _barbershop_id: string; _year_month: string }
        Returns: string
      }
      calculate_monthly_taxes: {
        Args: { _barbershop_id: string; _year_month: string }
        Returns: undefined
      }
      generate_fiscal_checklist: {
        Args: { _barbershop_id: string; _year_month: string }
        Returns: undefined
      }
      calculate_fiscal_score: {
        Args: { _barbershop_id: string; _year_month: string }
        Returns: number
      }
      update_daily_metrics: {
        Args: {
          p_barbershop_id: string
          p_date: string
          p_revenue?: number
          p_services_count?: number
          p_appointments_count?: number
          p_clients_count?: number
          p_cash_revenue?: number
          p_pix_revenue?: number
          p_card_revenue?: number
          p_commission_total?: number
        }
        Returns: void
      }
      calculate_professional_commission: {
        Args: {
          p_professional_id: string
          p_appointment_id: string
          p_payment_id: string
          p_total_amount: number
        }
        Returns: {
          commission_percent: number
          commission_amount: number
          success: boolean
          message: string
        }[]
      }
      get_pending_commissions: {
        Args: { p_professional_id: string }
        Returns: {
          id: string
          appointment_id: string
          payment_id: string
          commission_percent: number
          commission_amount: number
          total_amount: number
          created_at: string
        }[]
      }
      create_post_appointment_notification: {
        Args: {
          p_appointment_id: string
          p_professional_id: string
          p_notification_type: string
        }
        Returns: string
      }
      log_webhook_execution: {
        Args: {
          p_webhook_config_id: string
          p_event_type: string
          p_payload?: Json
          p_response_status?: number
          p_response_body?: string
          p_error_message?: string
          p_duration_ms?: number
        }
        Returns: void
      }
      get_active_webhooks: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          service_name: string
          webhook_url: string
          webhook_secret: string
          last_triggered: string | null
          last_success: string | null
        }[]
      }
      test_webhook: {
        Args: { p_webhook_config_id: string }
        Returns: {
          success: boolean
          status_code: number
          response_text: string
          duration_ms: number
        }[]
      }
      mark_overdue_taxes: {
        Args: Record<string, never>
        Returns: undefined
      }
      simulate_tax_regime: {
        Args: { _barbershop_id: string; _year_month: string; _target_regime: string }
        Returns: {
          tax_type: string
          tax_rate: number
          tax_amount: number
        }[]
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
