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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bmr_audit_log: {
        Row: {
          changed_columns: Json | null
          client_info: Json | null
          event_ts: string
          id: number
          new_data: Json | null
          old_data: Json | null
          operation: string
          row_id: string | null
          statement_txid: string | null
          table_name: string
          table_schema: string
          user_id: string | null
        }
        Insert: {
          changed_columns?: Json | null
          client_info?: Json | null
          event_ts?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          row_id?: string | null
          statement_txid?: string | null
          table_name: string
          table_schema: string
          user_id?: string | null
        }
        Update: {
          changed_columns?: Json | null
          client_info?: Json | null
          event_ts?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          row_id?: string | null
          statement_txid?: string | null
          table_name?: string
          table_schema?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bmr_client: {
        Row: {
          client_id: string
          created_at: string | null
          demo_days: number | null
          is_demo: boolean
          max_user: number
          name: string
          plan_id: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string
          created_at?: string | null
          demo_days?: number | null
          is_demo: boolean
          max_user: number
          name: string
          plan_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          demo_days?: number | null
          is_demo?: boolean
          max_user?: number
          name?: string
          plan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bmr_client_bmr_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bmr_plan"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      bmr_config_smtp: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_enabled: boolean
          sender_email: string
          sender_name: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_user: string
          updated_at: string
          use_ssl: boolean
          use_tls: boolean
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          sender_email: string
          sender_name: string
          smtp_host: string
          smtp_password: string
          smtp_port?: number
          smtp_user: string
          updated_at?: string
          use_ssl?: boolean
          use_tls?: boolean
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          sender_email?: string
          sender_name?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_user?: string
          updated_at?: string
          use_ssl?: boolean
          use_tls?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bmr_config_smtp_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "bmr_config_smtp_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      bmr_email_logs: {
        Row: {
          alert_type: string
          client_id: string
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string
          status: string
          subject: string
        }
        Insert: {
          alert_type: string
          client_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string
          status: string
          subject: string
        }
        Update: {
          alert_type?: string
          client_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "bmr_email_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "bmr_email_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      bmr_plan: {
        Row: {
          created_at: string
          plan: string
          plan_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          plan: string
          plan_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          plan?: string
          plan_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bmr_secrets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          secret_key: string
          secret_value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          secret_key: string
          secret_value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          secret_key?: string
          secret_value?: string
        }
        Relationships: []
      }
      bmr_system: {
        Row: {
          created_at: string
          description: string | null
          logo_url: string | null
          name: string
          system_id: string
          updated_at: string | null
          url: string | null
          vresion: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          logo_url?: string | null
          name: string
          system_id?: string
          updated_at?: string | null
          url?: string | null
          vresion?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          logo_url?: string | null
          name?: string
          system_id?: string
          updated_at?: string | null
          url?: string | null
          vresion?: string | null
        }
        Relationships: []
      }
      bmr_user: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          force_password_change: boolean | null
          is_active: boolean
          is_super_admin: boolean | null
          name: string | null
          password_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          force_password_change?: boolean | null
          is_active: boolean
          is_super_admin?: boolean | null
          name?: string | null
          password_hash: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          force_password_change?: boolean | null
          is_active?: boolean
          is_super_admin?: boolean | null
          name?: string | null
          password_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bmr_user_clients: {
        Row: {
          client_id: string
          created_at: string | null
          granted_at: string | null
          id: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          granted_at?: string | null
          id?: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          granted_at?: string | null
          id?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bmr_user_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "bmr_user_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "bmr_user_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bmr_user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bmr_user_system_access: {
        Row: {
          access_id: string
          granted_at: string | null
          profile: string
          system_id: string
          user_id: string
        }
        Insert: {
          access_id?: string
          granted_at?: string | null
          profile: string
          system_id: string
          user_id: string
        }
        Update: {
          access_id?: string
          granted_at?: string | null
          profile?: string
          system_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bmr_user_system_access_system"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "bmr_system"
            referencedColumns: ["system_id"]
          },
          {
            foreignKeyName: "fk_bmr_user_system_access_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bmr_user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      crm_activity: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          attendees: string[] | null
          client_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          duration_minutes: number | null
          end_date: string | null
          id: string
          location: string | null
          outcome: string | null
          priority: string | null
          related_to_id: string | null
          related_to_name: string | null
          related_to_type: string | null
          reminder: number | null
          start_date: string
          status: string | null
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          attendees?: string[] | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          id?: string
          location?: string | null
          outcome?: string | null
          priority?: string | null
          related_to_id?: string | null
          related_to_name?: string | null
          related_to_type?: string | null
          reminder?: number | null
          start_date: string
          status?: string | null
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          attendees?: string[] | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          duration_minutes?: number | null
          end_date?: string | null
          id?: string
          location?: string | null
          outcome?: string | null
          priority?: string | null
          related_to_id?: string | null
          related_to_name?: string | null
          related_to_type?: string | null
          reminder?: number | null
          start_date?: string
          status?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_activity_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_activity_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      crm_activity_history: {
        Row: {
          action_type: string
          client_id: string
          created_at: string | null
          description: string | null
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string
          performed_by_name: string | null
          related_to_id: string
          related_to_name: string | null
          related_to_type: string
        }
        Insert: {
          action_type: string
          client_id: string
          created_at?: string | null
          description?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          performed_by_name?: string | null
          related_to_id: string
          related_to_name?: string | null
          related_to_type: string
        }
        Update: {
          action_type?: string
          client_id?: string
          created_at?: string | null
          description?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          performed_by_name?: string | null
          related_to_id?: string
          related_to_name?: string | null
          related_to_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_activity_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_activity_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      crm_category: {
        Row: {
          category_type: string | null
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_type?: string | null
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_type?: string | null
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_category_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_category_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      crm_company: {
        Row: {
          address: string | null
          address_number: string | null
          annual_revenue: number | null
          assigned_to: string | null
          assigned_to_name: string | null
          city: string | null
          client_id: string
          company_size: string | null
          country: string | null
          created_at: string | null
          document_number: string | null
          email: string | null
          id: string
          industry: string | null
          legal_name: string | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          social_media: Json | null
          state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          city?: string | null
          client_id: string
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          document_number?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          social_media?: Json | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          city?: string | null
          client_id?: string
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          document_number?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          social_media?: Json | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_company_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_company_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      crm_contact: {
        Row: {
          address: string | null
          address_number: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          avatar_url: string | null
          birthday: string | null
          city: string | null
          client_id: string
          company_id: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          department: string | null
          email: string
          first_name: string
          id: string
          job_title: string | null
          last_name: string | null
          lead_source: string | null
          linkedin: string | null
          mobile: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          client_id: string
          company_id?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          first_name: string
          id?: string
          job_title?: string | null
          last_name?: string | null
          lead_source?: string | null
          linkedin?: string | null
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          client_id?: string
          company_id?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string | null
          lead_source?: string | null
          linkedin?: string | null
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contact_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crm_contact_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_contact_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      crm_department: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          manager_email: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_department_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_department_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      crm_lead: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          budget: number | null
          client_id: string
          company: string | null
          company_id: string | null
          contact_id: string | null
          converted_to_contact_id: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string
          id: string
          interest: string | null
          job_title: string | null
          last_contact_date: string | null
          name: string
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          score: number | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          budget?: number | null
          client_id: string
          company?: string | null
          company_id?: string | null
          contact_id?: string | null
          converted_to_contact_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email: string
          id?: string
          interest?: string | null
          job_title?: string | null
          last_contact_date?: string | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          budget?: number | null
          client_id?: string
          company?: string | null
          company_id?: string | null
          contact_id?: string | null
          converted_to_contact_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string
          id?: string
          interest?: string | null
          job_title?: string | null
          last_contact_date?: string | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_lead_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_lead_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_lead_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead_converted_to_contact"
            columns: ["converted_to_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunity: {
        Row: {
          actual_close_date: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          client_id: string
          company_id: string | null
          company_name: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          name: string
          next_step: string | null
          notes: string | null
          pipeline_id: string | null
          probability: number | null
          products: Json | null
          source: string | null
          stage: string | null
          tags: string[] | null
          updated_at: string | null
          value: number
        }
        Insert: {
          actual_close_date?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          client_id: string
          company_id?: string | null
          company_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          name: string
          next_step?: string | null
          notes?: string | null
          pipeline_id?: string | null
          probability?: number | null
          products?: Json | null
          source?: string | null
          stage?: string | null
          tags?: string[] | null
          updated_at?: string | null
          value: number
        }
        Update: {
          actual_close_date?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          client_id?: string
          company_id?: string | null
          company_name?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          name?: string
          next_step?: string | null
          notes?: string | null
          pipeline_id?: string | null
          probability?: number | null
          products?: Json | null
          source?: string | null
          stage?: string | null
          tags?: string[] | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_opportunity_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_opportunity_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_opportunity_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_opportunity_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contact"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_opportunity_pipeline"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          stages: Json
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          stages?: Json
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          stages?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_pipeline_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_pipeline_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      crm_product: {
        Row: {
          category: string | null
          client_id: string
          code: string | null
          cost: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          features: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          tags: string[] | null
          unit: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          code?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          tags?: string[] | null
          unit?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          code?: string | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          tags?: string[] | null
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_product_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_product_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      crm_system_setting: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_system_setting_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_crm_system_setting_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      gmd_change: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          affected_system: string
          approvers: Json | null
          archived: boolean | null
          attachments: Json | null
          backup_completed: boolean | null
          change_type: string
          client_id: string
          code: string | null
          created_at: string | null
          description: string | null
          documentation_updated: boolean | null
          id: string
          impact: string | null
          implementation_plan: string | null
          implementer: string | null
          notes: string | null
          priority: string | null
          requester: string | null
          requester_email: string | null
          risk_level: string | null
          rollback_plan: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          stage: string
          stakeholders_notified: boolean | null
          tags: string[] | null
          tests_completed: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          affected_system: string
          approvers?: Json | null
          archived?: boolean | null
          attachments?: Json | null
          backup_completed?: boolean | null
          change_type: string
          client_id: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          documentation_updated?: boolean | null
          id?: string
          impact?: string | null
          implementation_plan?: string | null
          implementer?: string | null
          notes?: string | null
          priority?: string | null
          requester?: string | null
          requester_email?: string | null
          risk_level?: string | null
          rollback_plan?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          stage?: string
          stakeholders_notified?: boolean | null
          tags?: string[] | null
          tests_completed?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          affected_system?: string
          approvers?: Json | null
          archived?: boolean | null
          attachments?: Json | null
          backup_completed?: boolean | null
          change_type?: string
          client_id?: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          documentation_updated?: boolean | null
          id?: string
          impact?: string | null
          implementation_plan?: string | null
          implementer?: string | null
          notes?: string | null
          priority?: string | null
          requester?: string | null
          requester_email?: string | null
          risk_level?: string | null
          rollback_plan?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          stage?: string
          stakeholders_notified?: boolean | null
          tags?: string[] | null
          tests_completed?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_change_change_type"
            columns: ["client_id", "change_type"]
            isOneToOne: false
            referencedRelation: "gmd_change_type"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_change_impact_level"
            columns: ["client_id", "impact"]
            isOneToOne: false
            referencedRelation: "gmd_impact_level"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_change_priority"
            columns: ["client_id", "priority"]
            isOneToOne: false
            referencedRelation: "gmd_priority"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_change_requester"
            columns: ["client_id", "requester_email"]
            isOneToOne: false
            referencedRelation: "gmd_user"
            referencedColumns: ["client_id", "email"]
          },
          {
            foreignKeyName: "fk_change_risk_level"
            columns: ["client_id", "risk_level"]
            isOneToOne: false
            referencedRelation: "gmd_risk_level"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_change_stage"
            columns: ["client_id", "stage"]
            isOneToOne: false
            referencedRelation: "gmd_stage"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_gmd_change_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_gmd_change_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      gmd_change_type: {
        Row: {
          active: boolean | null
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gmd_change_type_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_gmd_change_type_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      gmd_impact_level: {
        Row: {
          active: boolean | null
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gmd_impact_level_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_gmd_impact_level_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      gmd_priority: {
        Row: {
          active: boolean | null
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gmd_priority_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_gmd_priority_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      gmd_risk_level: {
        Row: {
          active: boolean | null
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gmd_risk_level_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_gmd_risk_level_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      gmd_stage: {
        Row: {
          active: boolean | null
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gmd_stage_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_gmd_stage_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      gmd_user: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          client_id: string
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          client_id: string
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          client_id?: string
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gmd_user_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_gmd_user_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          client_id: string
          created_at: string | null
          description: string
          id: string
          reference_id: string | null
          reference_table: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: string | null
          title: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          client_id: string
          created_at?: string | null
          description: string
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status?: string | null
          title: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          client_id?: string
          created_at?: string | null
          description?: string
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_asset_depreciation: {
        Row: {
          accumulated_depreciation: number | null
          annual_depreciation: number | null
          asset_id: string | null
          calculated_at: string | null
          client_id: string
          current_book_value: number | null
          depreciation_method: string | null
          id: string
          monthly_depreciation: number | null
          salvage_value: number | null
          useful_life_years: number
        }
        Insert: {
          accumulated_depreciation?: number | null
          annual_depreciation?: number | null
          asset_id?: string | null
          calculated_at?: string | null
          client_id: string
          current_book_value?: number | null
          depreciation_method?: string | null
          id?: string
          monthly_depreciation?: number | null
          salvage_value?: number | null
          useful_life_years: number
        }
        Update: {
          accumulated_depreciation?: number | null
          annual_depreciation?: number | null
          asset_id?: string | null
          calculated_at?: string | null
          client_id?: string
          current_book_value?: number | null
          depreciation_method?: string | null
          id?: string
          monthly_depreciation?: number | null
          salvage_value?: number | null
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "inv_asset_depreciation_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "inv_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_asset_depreciation_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_asset_depreciation_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_asset_history: {
        Row: {
          asset_id: string
          change_type: string
          changed_by: string
          client_id: string
          created_at: string | null
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
        }
        Insert: {
          asset_id: string
          change_type: string
          changed_by: string
          client_id: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Update: {
          asset_id?: string
          change_type?: string
          changed_by?: string
          client_id?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "inv_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_asset_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_asset_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_asset_types: {
        Row: {
          auto_schedule_maintenance: boolean | null
          category: string
          client_id: string
          color: string | null
          created_at: string | null
          depreciation_rate: number | null
          icon: string | null
          id: string
          last_maintenance_check: string | null
          maintenance_interval_days: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          auto_schedule_maintenance?: boolean | null
          category: string
          client_id: string
          color?: string | null
          created_at?: string | null
          depreciation_rate?: number | null
          icon?: string | null
          id?: string
          last_maintenance_check?: string | null
          maintenance_interval_days?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          auto_schedule_maintenance?: boolean | null
          category?: string
          client_id?: string
          color?: string | null
          created_at?: string | null
          depreciation_rate?: number | null
          icon?: string | null
          id?: string
          last_maintenance_check?: string | null
          maintenance_interval_days?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_asset_types_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_asset_types_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_assets: {
        Row: {
          asset_code: string
          assigned_to: string | null
          client_id: string
          created_at: string | null
          current_value: number | null
          department_id: string | null
          id: string
          image_url: string | null
          location_id: string | null
          manufacturer: string | null
          min_stock_level: number | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_value: number | null
          qr_code: string | null
          reorder_point: number | null
          serial_number: string | null
          specifications: Json | null
          status: Database["public"]["Enums"]["asset_status"] | null
          stock_location_id: string | null
          stock_quantity: number | null
          type_id: string
          updated_at: string | null
          vendor_id: string | null
          warranty_end: string | null
        }
        Insert: {
          asset_code: string
          assigned_to?: string | null
          client_id: string
          created_at?: string | null
          current_value?: number | null
          department_id?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          manufacturer?: string | null
          min_stock_level?: number | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          qr_code?: string | null
          reorder_point?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["asset_status"] | null
          stock_location_id?: string | null
          stock_quantity?: number | null
          type_id: string
          updated_at?: string | null
          vendor_id?: string | null
          warranty_end?: string | null
        }
        Update: {
          asset_code?: string
          assigned_to?: string | null
          client_id?: string
          created_at?: string | null
          current_value?: number | null
          department_id?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          manufacturer?: string | null
          min_stock_level?: number | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          qr_code?: string | null
          reorder_point?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["asset_status"] | null
          stock_location_id?: string | null
          stock_quantity?: number | null
          type_id?: string
          updated_at?: string | null
          vendor_id?: string | null
          warranty_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "bmr_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inv_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_assets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "inv_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_assets_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "inv_stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_assets_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "inv_asset_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_assets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "inv_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_compliance_audits: {
        Row: {
          audit_code: string
          audit_date: string
          auditor: string
          client_id: string
          created_at: string | null
          findings: Json | null
          findings_count: number | null
          id: string
          notes: string | null
          score: number | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          audit_code: string
          audit_date: string
          auditor: string
          client_id: string
          created_at?: string | null
          findings?: Json | null
          findings_count?: number | null
          id?: string
          notes?: string | null
          score?: number | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          audit_code?: string
          audit_date?: string
          auditor?: string
          client_id?: string
          created_at?: string | null
          findings?: Json | null
          findings_count?: number | null
          id?: string
          notes?: string | null
          score?: number | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_compliance_audits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_compliance_audits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_contract_assets: {
        Row: {
          added_at: string | null
          asset_id: string
          client_id: string
          contract_id: string
          id: string
        }
        Insert: {
          added_at?: string | null
          asset_id: string
          client_id: string
          contract_id: string
          id?: string
        }
        Update: {
          added_at?: string | null
          asset_id?: string
          client_id?: string
          contract_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_contract_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "inv_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_contract_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_contract_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_contract_assets_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "inv_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_contract_history: {
        Row: {
          change_type: string
          changed_by: string
          client_id: string
          contract_id: string
          created_at: string | null
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
        }
        Insert: {
          change_type: string
          changed_by: string
          client_id: string
          contract_id: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Update: {
          change_type?: string
          changed_by?: string
          client_id?: string
          contract_id?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_contract_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_contract_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_contract_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "inv_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_contracts: {
        Row: {
          auto_renewal: boolean | null
          client_id: string
          contract_code: string
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          monthly_cost: number | null
          notes: string | null
          purchase_option: boolean | null
          purchase_value: number | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          title: string
          total_value: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          auto_renewal?: boolean | null
          client_id: string
          contract_code: string
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          purchase_option?: boolean | null
          purchase_value?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          title: string
          total_value?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          auto_renewal?: boolean | null
          client_id?: string
          contract_code?: string
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          purchase_option?: boolean | null
          purchase_value?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          title?: string
          total_value?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "inv_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_departments: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_departments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_departments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "bmr_user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inv_guided_processes: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          steps: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_guided_processes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_guided_processes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_inventory_items: {
        Row: {
          aisle: string | null
          bin: string | null
          category: string
          client_id: string
          created_at: string | null
          entry_date: string | null
          id: string
          item_code: string
          location_id: string | null
          min_quantity: number
          name: string
          notes: string | null
          quantity: number
          shelf: string | null
          unit_value: number | null
          updated_at: string | null
          warehouse: string | null
          zone: string | null
        }
        Insert: {
          aisle?: string | null
          bin?: string | null
          category: string
          client_id: string
          created_at?: string | null
          entry_date?: string | null
          id?: string
          item_code: string
          location_id?: string | null
          min_quantity?: number
          name: string
          notes?: string | null
          quantity?: number
          shelf?: string | null
          unit_value?: number | null
          updated_at?: string | null
          warehouse?: string | null
          zone?: string | null
        }
        Update: {
          aisle?: string | null
          bin?: string | null
          category?: string
          client_id?: string
          created_at?: string | null
          entry_date?: string | null
          id?: string
          item_code?: string
          location_id?: string | null
          min_quantity?: number
          name?: string
          notes?: string | null
          quantity?: number
          shelf?: string | null
          unit_value?: number | null
          updated_at?: string | null
          warehouse?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_inventory_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_inventory_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_inventory_movements: {
        Row: {
          client_id: string
          created_at: string | null
          from_location_id: string | null
          id: string
          item_id: string
          movement_type: string
          performed_by: string
          quantity: number
          reason: string | null
          to_location_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          item_id: string
          movement_type: string
          performed_by: string
          quantity: number
          reason?: string | null
          to_location_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          performed_by?: string
          quantity?: number
          reason?: string | null
          to_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_inventory_movements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_inventory_movements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_inventory_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inv_inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_inventory_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_inventory_sessions: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          scanned_codes: string[]
          session_date: string
          status: string
          total_assets: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scanned_codes?: string[]
          session_date?: string
          status?: string
          total_assets?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scanned_codes?: string[]
          session_date?: string
          status?: string
          total_assets?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_inventory_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_inventory_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_leasing_contract_assets: {
        Row: {
          added_at: string | null
          asset_id: string | null
          client_id: string
          contract_id: string | null
          id: string
        }
        Insert: {
          added_at?: string | null
          asset_id?: string | null
          client_id: string
          contract_id?: string | null
          id?: string
        }
        Update: {
          added_at?: string | null
          asset_id?: string | null
          client_id?: string
          contract_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_leasing_contract_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "inv_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_leasing_contract_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_leasing_contract_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_leasing_contract_assets_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "inv_leasing_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_leasing_contracts: {
        Row: {
          client_id: string
          contract_code: string
          created_at: string | null
          end_date: string
          id: string
          monthly_cost: number | null
          notes: string | null
          purchase_option: boolean | null
          purchase_value: number | null
          start_date: string
          status: string | null
          total_value: number | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          client_id: string
          contract_code: string
          created_at?: string | null
          end_date: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          purchase_option?: boolean | null
          purchase_value?: number | null
          start_date: string
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          client_id?: string
          contract_code?: string
          created_at?: string | null
          end_date?: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          purchase_option?: boolean | null
          purchase_value?: number | null
          start_date?: string
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_leasing_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_leasing_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_leasing_contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "inv_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_locations: {
        Row: {
          address: string | null
          cep: string | null
          client_id: string
          created_at: string | null
          details: Json | null
          floor_number: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cep?: string | null
          client_id: string
          created_at?: string | null
          details?: Json | null
          floor_number?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cep?: string | null
          client_id?: string
          created_at?: string | null
          details?: Json | null
          floor_number?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_maintenance_history: {
        Row: {
          change_type: string
          changed_by: string
          client_id: string
          created_at: string | null
          id: string
          maintenance_id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
        }
        Insert: {
          change_type: string
          changed_by: string
          client_id: string
          created_at?: string | null
          id?: string
          maintenance_id: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Update: {
          change_type?: string
          changed_by?: string
          client_id?: string
          created_at?: string | null
          id?: string
          maintenance_id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_maintenance_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_maintenance_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_maintenance_history_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "inv_maintenances"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_maintenances: {
        Row: {
          asset_id: string
          client_id: string
          completed_date: string | null
          cost: number | null
          created_at: string | null
          description: string
          id: string
          maintenance_code: string
          notes: string | null
          priority: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["maintenance_status"] | null
          technician_id: string | null
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at: string | null
        }
        Insert: {
          asset_id: string
          client_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description: string
          id?: string
          maintenance_code: string
          notes?: string | null
          priority?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          technician_id?: string | null
          type: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string | null
        }
        Update: {
          asset_id?: string
          client_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string
          id?: string
          maintenance_code?: string
          notes?: string | null
          priority?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          technician_id?: string | null
          type?: Database["public"]["Enums"]["maintenance_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_maintenances_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "inv_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_maintenances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_maintenances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_maintenances_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "bmr_user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inv_process_executions: {
        Row: {
          client_id: string
          completed_at: string | null
          completed_steps: Json | null
          context_data: Json | null
          current_step: number | null
          id: string
          process_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completed_steps?: Json | null
          context_data?: Json | null
          current_step?: number | null
          id?: string
          process_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completed_steps?: Json | null
          context_data?: Json | null
          current_step?: number | null
          id?: string
          process_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_process_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_process_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_process_executions_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "inv_guided_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_software: {
        Row: {
          client_id: string
          created_at: string | null
          expiry_date: string | null
          id: string
          license_key: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          licenses_total: number
          licenses_used: number | null
          monthly_cost: number | null
          name: string
          notes: string | null
          purchase_date: string | null
          software_code: string
          total_cost: number | null
          updated_at: string | null
          vendor_id: string | null
          version: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          licenses_total?: number
          licenses_used?: number | null
          monthly_cost?: number | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          software_code: string
          total_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          version?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          licenses_total?: number
          licenses_used?: number | null
          monthly_cost?: number | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          software_code?: string
          total_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_software_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_software_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_software_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "inv_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_software_history: {
        Row: {
          change_type: string
          changed_by: string
          client_id: string
          created_at: string | null
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          software_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          client_id: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          software_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          client_id?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_software_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_software_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_software_history_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "inv_software"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_software_installations: {
        Row: {
          asset_id: string
          client_id: string
          id: string
          installed_at: string | null
          installed_by: string | null
          license_key: string | null
          notes: string | null
          software_id: string
        }
        Insert: {
          asset_id: string
          client_id: string
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          license_key?: string | null
          notes?: string | null
          software_id: string
        }
        Update: {
          asset_id?: string
          client_id?: string
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          license_key?: string | null
          notes?: string | null
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_software_installations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "inv_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_software_installations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_software_installations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_software_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "bmr_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inv_software_installations_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "inv_software"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_stock_locations: {
        Row: {
          address: string | null
          client_id: string
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_capacity: number | null
          name: string
          notes: string | null
          responsible: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          client_id: string
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name: string
          notes?: string | null
          responsible?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          client_id?: string
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name?: string
          notes?: string | null
          responsible?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_stock_locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_stock_locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_suppliers: {
        Row: {
          address: string | null
          city: string | null
          client_id: string
          cnpj: string | null
          complement: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          fantasy_name: string | null
          id: string
          legal_nature: string | null
          logo_url: string | null
          main_activity: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          number: string | null
          opening_date: string | null
          state: string | null
          street: string | null
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_id: string
          cnpj?: string | null
          complement?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          fantasy_name?: string | null
          id?: string
          legal_nature?: string | null
          logo_url?: string | null
          main_activity?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          opening_date?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_id?: string
          cnpj?: string | null
          complement?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          fantasy_name?: string | null
          id?: string
          legal_nature?: string | null
          logo_url?: string | null
          main_activity?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          opening_date?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_suppliers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_suppliers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_system_settings: {
        Row: {
          category: string
          client_id: string
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_system_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_system_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_vulnerabilities: {
        Row: {
          affected_assets_count: number | null
          assigned_to: string | null
          client_id: string
          created_at: string | null
          cve_code: string
          cvss_score: number | null
          description: string | null
          discovered_date: string
          due_date: string | null
          id: string
          notes: string | null
          remediation_plan: string | null
          severity: Database["public"]["Enums"]["vulnerability_severity"]
          status: Database["public"]["Enums"]["vulnerability_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_assets_count?: number | null
          assigned_to?: string | null
          client_id: string
          created_at?: string | null
          cve_code: string
          cvss_score?: number | null
          description?: string | null
          discovered_date: string
          due_date?: string | null
          id?: string
          notes?: string | null
          remediation_plan?: string | null
          severity: Database["public"]["Enums"]["vulnerability_severity"]
          status?: Database["public"]["Enums"]["vulnerability_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_assets_count?: number | null
          assigned_to?: string | null
          client_id?: string
          created_at?: string | null
          cve_code?: string
          cvss_score?: number | null
          description?: string | null
          discovered_date?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          remediation_plan?: string | null
          severity?: Database["public"]["Enums"]["vulnerability_severity"]
          status?: Database["public"]["Enums"]["vulnerability_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inv_vulnerabilities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "bmr_user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inv_vulnerabilities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_vulnerabilities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      inv_vulnerability_assets: {
        Row: {
          asset_id: string
          client_id: string
          created_at: string
          discovered_at: string
          id: string
          notes: string | null
          remediated_at: string | null
          vulnerability_id: string
        }
        Insert: {
          asset_id: string
          client_id: string
          created_at?: string
          discovered_at?: string
          id?: string
          notes?: string | null
          remediated_at?: string | null
          vulnerability_id: string
        }
        Update: {
          asset_id?: string
          client_id?: string
          created_at?: string
          discovered_at?: string
          id?: string
          notes?: string | null
          remediated_at?: string | null
          vulnerability_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_vulnerability_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "inv_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_vulnerability_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_vulnerability_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "inv_vulnerability_assets_vulnerability_id_fkey"
            columns: ["vulnerability_id"]
            isOneToOne: false
            referencedRelation: "inv_vulnerabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_board: {
        Row: {
          client_id: string
          columns: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          columns: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          columns?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_board_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_board_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_comment: {
        Row: {
          client_id: string
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          mentions: Json | null
          project_id: string
          story_id: string | null
          task_id: string | null
          updated_at: string | null
          user_avatar_url: string | null
          user_email: string
          user_name: string | null
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentions?: Json | null
          project_id: string
          story_id?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_avatar_url?: string | null
          user_email: string
          user_name?: string | null
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentions?: Json | null
          project_id?: string
          story_id?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_avatar_url?: string | null
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_comment_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_comment_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_comment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_comment_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "prj_story"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_comment_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "prj_task"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_custom_complexity_setting: {
        Row: {
          client_id: string
          complexity_type_id: string
          created_at: string | null
          id: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          complexity_type_id: string
          created_at?: string | null
          id?: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          complexity_type_id?: string
          created_at?: string | null
          id?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_custom_complexity_setting_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_custom_complexity_setting_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_dashboard_config: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          filters: Json | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          layout: string | null
          name: string
          refresh_interval: number | null
          updated_at: string | null
          user_email: string
          widgets: Json | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout?: string | null
          name: string
          refresh_interval?: number | null
          updated_at?: string | null
          user_email: string
          widgets?: Json | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout?: string | null
          name?: string
          refresh_interval?: number | null
          updated_at?: string | null
          user_email?: string
          widgets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_dashboard_config_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_dashboard_config_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_epic: {
        Row: {
          business_value: string | null
          client_id: string
          color: string | null
          completed_date: string | null
          created_at: string | null
          description: string | null
          epic_number: string | null
          id: string
          owner_email: string | null
          owner_name: string | null
          priority: string | null
          progress: number | null
          project_id: string
          project_name: string | null
          start_date: string | null
          status: string | null
          tags: Json | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          business_value?: string | null
          client_id: string
          color?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          epic_number?: string | null
          id?: string
          owner_email?: string | null
          owner_name?: string | null
          priority?: string | null
          progress?: number | null
          project_id: string
          project_name?: string | null
          start_date?: string | null
          status?: string | null
          tags?: Json | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          business_value?: string | null
          client_id?: string
          color?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          epic_number?: string | null
          id?: string
          owner_email?: string | null
          owner_name?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string
          project_name?: string | null
          start_date?: string | null
          status?: string | null
          tags?: Json | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_epic_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_epic_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_epic_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_feature: {
        Row: {
          acceptance_criteria: string | null
          client_id: string
          completed_date: string | null
          created_at: string | null
          description: string | null
          epic_id: string | null
          epic_title: string | null
          feature_number: string | null
          id: string
          owner_email: string | null
          owner_name: string | null
          priority: string | null
          progress: number | null
          project_id: string
          project_name: string | null
          start_date: string | null
          status: string | null
          tags: Json | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: string | null
          client_id: string
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          epic_id?: string | null
          epic_title?: string | null
          feature_number?: string | null
          id?: string
          owner_email?: string | null
          owner_name?: string | null
          priority?: string | null
          progress?: number | null
          project_id: string
          project_name?: string | null
          start_date?: string | null
          status?: string | null
          tags?: Json | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: string | null
          client_id?: string
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          epic_id?: string | null
          epic_title?: string | null
          feature_number?: string | null
          id?: string
          owner_email?: string | null
          owner_name?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string
          project_name?: string | null
          start_date?: string | null
          status?: string | null
          tags?: Json | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_feature_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_feature_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_feature_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "prj_epic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_feature_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_holiday: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_holiday_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_holiday_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_issue: {
        Row: {
          assigned_to_email: string | null
          assigned_to_name: string | null
          category: string | null
          client_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          impact_description: string | null
          issue_number: string | null
          priority: string | null
          project_id: string
          project_name: string | null
          reported_by_email: string
          reported_by_name: string | null
          reported_date: string | null
          resolution_date: string | null
          resolution_notes: string | null
          risk_id: string | null
          root_cause: string | null
          severity: string
          sprint_id: string | null
          status: string | null
          tags: Json | null
          task_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          category?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact_description?: string | null
          issue_number?: string | null
          priority?: string | null
          project_id: string
          project_name?: string | null
          reported_by_email: string
          reported_by_name?: string | null
          reported_date?: string | null
          resolution_date?: string | null
          resolution_notes?: string | null
          risk_id?: string | null
          root_cause?: string | null
          severity: string
          sprint_id?: string | null
          status?: string | null
          tags?: Json | null
          task_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          category?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact_description?: string | null
          issue_number?: string | null
          priority?: string | null
          project_id?: string
          project_name?: string | null
          reported_by_email?: string
          reported_by_name?: string | null
          reported_date?: string | null
          resolution_date?: string | null
          resolution_notes?: string | null
          risk_id?: string | null
          root_cause?: string | null
          severity?: string
          sprint_id?: string | null
          status?: string | null
          tags?: Json | null
          task_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_issue_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_issue_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_issue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_issue_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "prj_risk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_issue_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "prj_sprint"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_issue_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "prj_task"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_notification: {
        Row: {
          client_id: string
          comment_id: string | null
          created_at: string | null
          from_user_email: string
          from_user_name: string | null
          id: string
          is_read: boolean | null
          message: string
          project_id: string | null
          project_name: string | null
          read_at: string | null
          source_id: string | null
          source_title: string | null
          source_type: string | null
          title: string
          type: string
          updated_at: string | null
          user_email: string
        }
        Insert: {
          client_id: string
          comment_id?: string | null
          created_at?: string | null
          from_user_email: string
          from_user_name?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          project_id?: string | null
          project_name?: string | null
          read_at?: string | null
          source_id?: string | null
          source_title?: string | null
          source_type?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_email: string
        }
        Update: {
          client_id?: string
          comment_id?: string | null
          created_at?: string | null
          from_user_email?: string
          from_user_name?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          project_id?: string | null
          project_name?: string | null
          read_at?: string | null
          source_id?: string | null
          source_title?: string | null
          source_type?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_notification_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_notification_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_notification_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_planning_poker_session: {
        Row: {
          active_participants: Json | null
          client_id: string
          complexity_type: string | null
          created_at: string | null
          current_story_index: number | null
          id: string
          moderator_email: string
          moderator_name: string | null
          name: string
          participants: Json | null
          project_id: string
          project_name: string | null
          sprint_id: string | null
          status: string | null
          stories: Json | null
          updated_at: string | null
        }
        Insert: {
          active_participants?: Json | null
          client_id: string
          complexity_type?: string | null
          created_at?: string | null
          current_story_index?: number | null
          id?: string
          moderator_email: string
          moderator_name?: string | null
          name: string
          participants?: Json | null
          project_id: string
          project_name?: string | null
          sprint_id?: string | null
          status?: string | null
          stories?: Json | null
          updated_at?: string | null
        }
        Update: {
          active_participants?: Json | null
          client_id?: string
          complexity_type?: string | null
          created_at?: string | null
          current_story_index?: number | null
          id?: string
          moderator_email?: string
          moderator_name?: string | null
          name?: string
          participants?: Json | null
          project_id?: string
          project_name?: string | null
          sprint_id?: string | null
          status?: string | null
          stories?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_planning_poker_session_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_planning_poker_session_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_planning_poker_session_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_planning_poker_session_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "prj_sprint"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_planning_poker_vote: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_revealed: boolean | null
          session_id: string
          story_id: string
          updated_at: string | null
          vote_value: string
          voter_email: string
          voter_name: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_revealed?: boolean | null
          session_id: string
          story_id: string
          updated_at?: string | null
          vote_value: string
          voter_email: string
          voter_name?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_revealed?: boolean | null
          session_id?: string
          story_id?: string
          updated_at?: string | null
          vote_value?: string
          voter_email?: string
          voter_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_planning_poker_vote_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_planning_poker_vote_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_planning_poker_vote_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "prj_planning_poker_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_planning_poker_vote_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "prj_story"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_project: {
        Row: {
          actual_end_date: string | null
          board_id: string | null
          budget: number | null
          category: string | null
          client_id: string
          code: string
          color: string | null
          complexity_type: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          health_status: string | null
          id: string
          manager_email: string | null
          manager_name: string | null
          methodology: string
          name: string
          parent_project_id: string | null
          priority: string | null
          progress: number | null
          spent_amount: number | null
          start_date: string | null
          status: string | null
          tags: Json | null
          team_ids: Json | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          board_id?: string | null
          budget?: number | null
          category?: string | null
          client_id: string
          code: string
          color?: string | null
          complexity_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          health_status?: string | null
          id?: string
          manager_email?: string | null
          manager_name?: string | null
          methodology: string
          name: string
          parent_project_id?: string | null
          priority?: string | null
          progress?: number | null
          spent_amount?: number | null
          start_date?: string | null
          status?: string | null
          tags?: Json | null
          team_ids?: Json | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          board_id?: string | null
          budget?: number | null
          category?: string | null
          client_id?: string
          code?: string
          color?: string | null
          complexity_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          health_status?: string | null
          id?: string
          manager_email?: string | null
          manager_name?: string | null
          methodology?: string
          name?: string
          parent_project_id?: string | null
          priority?: string | null
          progress?: number | null
          spent_amount?: number | null
          start_date?: string | null
          status?: string | null
          tags?: Json | null
          team_ids?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_project_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_project_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_project_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "prj_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_project_parent_project_id_fkey"
            columns: ["parent_project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_project_category: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order: number | null
          order_category: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order?: number | null
          order_category?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order?: number | null
          order_category?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_project_category_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_project_category_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_resource_allocation: {
        Row: {
          allocated_hours: number
          allocation_type: string
          availability_percentage: number | null
          client_id: string
          created_at: string | null
          end_date: string
          id: string
          notes: string | null
          project_id: string
          sprint_id: string | null
          start_date: string
          story_id: string | null
          task_id: string | null
          updated_at: string | null
          user_email: string
          user_name: string | null
        }
        Insert: {
          allocated_hours: number
          allocation_type: string
          availability_percentage?: number | null
          client_id: string
          created_at?: string | null
          end_date: string
          id?: string
          notes?: string | null
          project_id: string
          sprint_id?: string | null
          start_date: string
          story_id?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_email: string
          user_name?: string | null
        }
        Update: {
          allocated_hours?: number
          allocation_type?: string
          availability_percentage?: number | null
          client_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          project_id?: string
          sprint_id?: string | null
          start_date?: string
          story_id?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_resource_allocation_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_resource_allocation_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_resource_allocation_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_resource_allocation_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "prj_sprint"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_resource_allocation_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "prj_story"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_resource_allocation_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "prj_task"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_risk: {
        Row: {
          category: string | null
          client_id: string
          contingency_plan: string | null
          created_at: string | null
          description: string | null
          id: string
          identified_date: string | null
          impact: number
          mitigation_plan: string | null
          occurrence_date: string | null
          owner_email: string | null
          owner_name: string | null
          probability: number
          project_id: string
          project_name: string | null
          review_date: string | null
          risk_level: string | null
          risk_score: number | null
          status: string | null
          tags: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          contingency_plan?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          identified_date?: string | null
          impact: number
          mitigation_plan?: string | null
          occurrence_date?: string | null
          owner_email?: string | null
          owner_name?: string | null
          probability: number
          project_id: string
          project_name?: string | null
          review_date?: string | null
          risk_level?: string | null
          risk_score?: number | null
          status?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          contingency_plan?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          identified_date?: string | null
          impact?: number
          mitigation_plan?: string | null
          occurrence_date?: string | null
          owner_email?: string | null
          owner_name?: string | null
          probability?: number
          project_id?: string
          project_name?: string | null
          review_date?: string | null
          risk_level?: string | null
          risk_score?: number | null
          status?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_risk_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_risk_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_risk_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_sprint: {
        Row: {
          board_id: string | null
          client_id: string
          completed_story_points: number | null
          created_at: string | null
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string
          project_name: string | null
          start_date: string
          status: string | null
          total_story_points: number | null
          updated_at: string | null
        }
        Insert: {
          board_id?: string | null
          client_id: string
          completed_story_points?: number | null
          created_at?: string | null
          end_date: string
          goal?: string | null
          id?: string
          name: string
          project_id: string
          project_name?: string | null
          start_date: string
          status?: string | null
          total_story_points?: number | null
          updated_at?: string | null
        }
        Update: {
          board_id?: string | null
          client_id?: string
          completed_story_points?: number | null
          created_at?: string | null
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          project_name?: string | null
          start_date?: string
          status?: string | null
          total_story_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_sprint_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_sprint_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_sprint_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "prj_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_sprint_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_sprint_report: {
        Row: {
          burndown_data: Json | null
          client_id: string
          commitment_accuracy: number | null
          completed_stories_count: number | null
          completed_story_points: number | null
          completion_date: string | null
          created_at: string | null
          end_date: string
          goal_achieved: boolean | null
          id: string
          incomplete_stories_count: number | null
          incomplete_story_points: number | null
          notes: string | null
          planned_stories_count: number | null
          planned_story_points: number | null
          project_id: string
          project_name: string | null
          retrospective_notes: string | null
          sprint_goal: string | null
          sprint_id: string
          sprint_name: string | null
          start_date: string
          stories_data: Json | null
          tasks_by_user: Json | null
          team_members: Json | null
          throughput_data: Json | null
          updated_at: string | null
          velocity: number | null
        }
        Insert: {
          burndown_data?: Json | null
          client_id: string
          commitment_accuracy?: number | null
          completed_stories_count?: number | null
          completed_story_points?: number | null
          completion_date?: string | null
          created_at?: string | null
          end_date: string
          goal_achieved?: boolean | null
          id?: string
          incomplete_stories_count?: number | null
          incomplete_story_points?: number | null
          notes?: string | null
          planned_stories_count?: number | null
          planned_story_points?: number | null
          project_id: string
          project_name?: string | null
          retrospective_notes?: string | null
          sprint_goal?: string | null
          sprint_id: string
          sprint_name?: string | null
          start_date: string
          stories_data?: Json | null
          tasks_by_user?: Json | null
          team_members?: Json | null
          throughput_data?: Json | null
          updated_at?: string | null
          velocity?: number | null
        }
        Update: {
          burndown_data?: Json | null
          client_id?: string
          commitment_accuracy?: number | null
          completed_stories_count?: number | null
          completed_story_points?: number | null
          completion_date?: string | null
          created_at?: string | null
          end_date?: string
          goal_achieved?: boolean | null
          id?: string
          incomplete_stories_count?: number | null
          incomplete_story_points?: number | null
          notes?: string | null
          planned_stories_count?: number | null
          planned_story_points?: number | null
          project_id?: string
          project_name?: string | null
          retrospective_notes?: string | null
          sprint_goal?: string | null
          sprint_id?: string
          sprint_name?: string | null
          start_date?: string
          stories_data?: Json | null
          tasks_by_user?: Json | null
          team_members?: Json | null
          throughput_data?: Json | null
          updated_at?: string | null
          velocity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_sprint_report_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_sprint_report_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_sprint_report_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_sprint_report_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "prj_sprint"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_story: {
        Row: {
          acceptance_criteria: Json | null
          assigned_to_email: string | null
          assigned_to_name: string | null
          attachments: Json | null
          client_id: string
          completed_date: string | null
          created_at: string | null
          definition_of_done: string | null
          description: string | null
          due_date: string | null
          epic_id: string | null
          feature_id: string | null
          feature_title: string | null
          id: string
          priority: string | null
          progress: number | null
          project_id: string
          project_name: string | null
          sprint_id: string | null
          status: string | null
          story_number: string | null
          story_points: string | null
          story_type_color: string | null
          story_type_id: string | null
          story_type_name: string | null
          tags: Json | null
          technical_details: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: Json | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          attachments?: Json | null
          client_id: string
          completed_date?: string | null
          created_at?: string | null
          definition_of_done?: string | null
          description?: string | null
          due_date?: string | null
          epic_id?: string | null
          feature_id?: string | null
          feature_title?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          project_id: string
          project_name?: string | null
          sprint_id?: string | null
          status?: string | null
          story_number?: string | null
          story_points?: string | null
          story_type_color?: string | null
          story_type_id?: string | null
          story_type_name?: string | null
          tags?: Json | null
          technical_details?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: Json | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          attachments?: Json | null
          client_id?: string
          completed_date?: string | null
          created_at?: string | null
          definition_of_done?: string | null
          description?: string | null
          due_date?: string | null
          epic_id?: string | null
          feature_id?: string | null
          feature_title?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          project_id?: string
          project_name?: string | null
          sprint_id?: string | null
          status?: string | null
          story_number?: string | null
          story_points?: string | null
          story_type_color?: string | null
          story_type_id?: string | null
          story_type_name?: string | null
          tags?: Json | null
          technical_details?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_story_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_story_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_story_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "prj_epic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_story_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "prj_feature"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_story_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_story_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "prj_sprint"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_story_story_type_id_fkey"
            columns: ["story_type_id"]
            isOneToOne: false
            referencedRelation: "prj_story_type"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_story_type: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order: number | null
          order_story_type: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order?: number | null
          order_story_type?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order?: number | null
          order_story_type?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_story_type_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_story_type_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_system_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prj_task: {
        Row: {
          assigned_to_email: string | null
          assigned_to_name: string | null
          attachments: Json | null
          blocked_reason: string | null
          checklist: Json | null
          client_id: string
          completed_date: string | null
          created_at: string | null
          dependencies: Json | null
          description: string | null
          due_date: string | null
          epic_id: string | null
          estimated_hours: number | null
          feature_id: string | null
          id: string
          is_milestone: boolean | null
          logged_hours: number | null
          milestone_id: string | null
          milestone_order: number | null
          parent_id: string | null
          priority: string | null
          progress: number | null
          project_id: string
          project_name: string | null
          reporter_email: string | null
          reporter_name: string | null
          sprint_id: string | null
          start_date: string | null
          status: string | null
          story_id: string | null
          story_points: number | null
          story_title: string | null
          tags: Json | null
          task_number: string | null
          task_type_color: string | null
          task_type_id: string | null
          task_type_name: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          attachments?: Json | null
          blocked_reason?: string | null
          checklist?: Json | null
          client_id: string
          completed_date?: string | null
          created_at?: string | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          epic_id?: string | null
          estimated_hours?: number | null
          feature_id?: string | null
          id?: string
          is_milestone?: boolean | null
          logged_hours?: number | null
          milestone_id?: string | null
          milestone_order?: number | null
          parent_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id: string
          project_name?: string | null
          reporter_email?: string | null
          reporter_name?: string | null
          sprint_id?: string | null
          start_date?: string | null
          status?: string | null
          story_id?: string | null
          story_points?: number | null
          story_title?: string | null
          tags?: Json | null
          task_number?: string | null
          task_type_color?: string | null
          task_type_id?: string | null
          task_type_name?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          attachments?: Json | null
          blocked_reason?: string | null
          checklist?: Json | null
          client_id?: string
          completed_date?: string | null
          created_at?: string | null
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          epic_id?: string | null
          estimated_hours?: number | null
          feature_id?: string | null
          id?: string
          is_milestone?: boolean | null
          logged_hours?: number | null
          milestone_id?: string | null
          milestone_order?: number | null
          parent_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string
          project_name?: string | null
          reporter_email?: string | null
          reporter_name?: string | null
          sprint_id?: string | null
          start_date?: string | null
          status?: string | null
          story_id?: string | null
          story_points?: number | null
          story_title?: string | null
          tags?: Json | null
          task_number?: string | null
          task_type_color?: string | null
          task_type_id?: string | null
          task_type_name?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_task_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_task_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_task_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "prj_epic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_task_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "prj_feature"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_task_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "prj_task"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_task_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "prj_task"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_task_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_task_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "prj_sprint"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_task_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "prj_story"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_task_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "prj_task_type"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_task_type: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order: number | null
          order_task_type: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order?: number | null
          order_task_type?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order?: number | null
          order_task_type?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_task_type_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_task_type_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_team: {
        Row: {
          client_id: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          members: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          members?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          members?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_team_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_team_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_time_log: {
        Row: {
          approved_at: string | null
          approved_by_email: string | null
          client_id: string
          created_at: string | null
          date: string
          description: string | null
          end_time: string | null
          hours: number
          id: string
          is_approved: boolean | null
          is_billable: boolean | null
          is_rejected: boolean | null
          log_type: string | null
          mentions: Json | null
          project_id: string
          project_name: string | null
          rejected_at: string | null
          rejected_by_email: string | null
          rejection_reason: string | null
          start_time: string | null
          story_id: string | null
          task_id: string
          task_title: string | null
          updated_at: string | null
          user_email: string
          user_name: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_email?: string | null
          client_id: string
          created_at?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          hours: number
          id?: string
          is_approved?: boolean | null
          is_billable?: boolean | null
          is_rejected?: boolean | null
          log_type?: string | null
          mentions?: Json | null
          project_id: string
          project_name?: string | null
          rejected_at?: string | null
          rejected_by_email?: string | null
          rejection_reason?: string | null
          start_time?: string | null
          story_id?: string | null
          task_id: string
          task_title?: string | null
          updated_at?: string | null
          user_email: string
          user_name?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by_email?: string | null
          client_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          hours?: number
          id?: string
          is_approved?: boolean | null
          is_billable?: boolean | null
          is_rejected?: boolean | null
          log_type?: string | null
          mentions?: Json | null
          project_id?: string
          project_name?: string | null
          rejected_at?: string | null
          rejected_by_email?: string | null
          rejection_reason?: string | null
          start_time?: string | null
          story_id?: string | null
          task_id?: string
          task_title?: string | null
          updated_at?: string | null
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_time_log_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_time_log_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_time_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_time_log_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "prj_story"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_time_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "prj_task"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_time_tracking_session: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          last_activity: string | null
          project_id: string
          project_name: string | null
          start_time: string
          status: string | null
          task_id: string
          task_title: string | null
          updated_at: string | null
          user_email: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          last_activity?: string | null
          project_id: string
          project_name?: string | null
          start_time: string
          status?: string | null
          task_id: string
          task_title?: string | null
          updated_at?: string | null
          user_email: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          last_activity?: string | null
          project_id?: string
          project_name?: string | null
          start_time?: string
          status?: string | null
          task_id?: string
          task_title?: string | null
          updated_at?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_time_tracking_session_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_time_tracking_session_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prj_time_tracking_session_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "prj_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prj_time_tracking_session_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "prj_task"
            referencedColumns: ["id"]
          },
        ]
      }
      prj_user_type: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order: number | null
          order_user_type: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order?: number | null
          order_user_type?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order?: number | null
          order_user_type?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_user_type_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_user_type_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      prj_work_calendar: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          hours_per_day: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string | null
          work_days: Json
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          hours_per_day?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          work_days: Json
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          hours_per_day?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          work_days?: Json
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prj_work_calendar_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_prj_work_calendar_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sol_category: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_category_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_category_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sol_department: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          manager_email: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_department_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_department_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sol_holiday: {
        Row: {
          client_id: string
          created_at: string | null
          holiday_date: string
          id: string
          name: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          holiday_date: string
          id?: string
          name: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          holiday_date?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_holiday_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_holiday_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sol_priority: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sla_hours: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sla_hours?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sla_hours?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_priority_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_priority_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sol_sla_policy: {
        Row: {
          category_code: string
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          priority_code: string
          resolution_time_minutes: number
          response_time_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          category_code: string
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority_code: string
          resolution_time_minutes: number
          response_time_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority_code?: string
          resolution_time_minutes?: number
          response_time_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sla_policy_category"
            columns: ["client_id", "category_code"]
            isOneToOne: false
            referencedRelation: "sol_category"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_sla_policy_priority"
            columns: ["client_id", "priority_code"]
            isOneToOne: false
            referencedRelation: "sol_priority"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_sol_sla_policy_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_sla_policy_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sol_system_setting: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_system_setting_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_system_setting_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sol_technician: {
        Row: {
          avatar_color: string | null
          client_id: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          max_tickets: number | null
          name: string
          phone: string | null
          sort_order: number | null
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_color?: string | null
          client_id: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          max_tickets?: number | null
          name: string
          phone?: string | null
          sort_order?: number | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_color?: string | null
          client_id?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          max_tickets?: number | null
          name?: string
          phone?: string | null
          sort_order?: number | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_technician_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_technician_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sol_ticket: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          category_code: string
          client_id: string
          created_at: string | null
          department_code: string | null
          description: string
          id: string
          priority_code: string
          requester_email: string
          requester_name: string | null
          resolution_notes: string | null
          resolution_time_minutes: number | null
          satisfaction_comment: string | null
          satisfaction_rating: number | null
          sla_deadline: string | null
          sla_status: string | null
          status: string
          ticket_number: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          category_code: string
          client_id: string
          created_at?: string | null
          department_code?: string | null
          description: string
          id?: string
          priority_code?: string
          requester_email: string
          requester_name?: string | null
          resolution_notes?: string | null
          resolution_time_minutes?: number | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          sla_deadline?: string | null
          sla_status?: string | null
          status?: string
          ticket_number?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          category_code?: string
          client_id?: string
          created_at?: string | null
          department_code?: string | null
          description?: string
          id?: string
          priority_code?: string
          requester_email?: string
          requester_name?: string | null
          resolution_notes?: string | null
          resolution_time_minutes?: number | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          sla_deadline?: string | null
          sla_status?: string | null
          status?: string
          ticket_number?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_ticket_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_ticket_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_ticket_assigned_to"
            columns: ["client_id", "assigned_to"]
            isOneToOne: false
            referencedRelation: "sol_technician"
            referencedColumns: ["client_id", "email"]
          },
          {
            foreignKeyName: "fk_ticket_category"
            columns: ["client_id", "category_code"]
            isOneToOne: false
            referencedRelation: "sol_category"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_ticket_department"
            columns: ["client_id", "department_code"]
            isOneToOne: false
            referencedRelation: "sol_department"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_ticket_priority"
            columns: ["client_id", "priority_code"]
            isOneToOne: false
            referencedRelation: "sol_priority"
            referencedColumns: ["client_id", "code"]
          },
        ]
      }
      sol_ticket_history: {
        Row: {
          action_type: string
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string
          ticket_id: string
        }
        Insert: {
          action_type: string
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          ticket_id: string
        }
        Update: {
          action_type?: string
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_ticket_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_ticket_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_ticket_history_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "sol_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      sol_work_calendar: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          work_days: number[]
          work_end_time: string
          work_start_time: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          work_days: number[]
          work_end_time: string
          work_start_time: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          work_days?: number[]
          work_end_time?: string
          work_start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sol_work_calendar_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sol_work_calendar_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_approval: {
        Row: {
          approved_amount: number | null
          approved_date: string | null
          approver_email: string
          approver_name: string | null
          client_id: string
          comments: string | null
          created_at: string | null
          id: string
          level: number
          level_name: string | null
          notification_sent: boolean | null
          request_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_amount?: number | null
          approved_date?: string | null
          approver_email: string
          approver_name?: string | null
          client_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          level: number
          level_name?: string | null
          notification_sent?: boolean | null
          request_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_amount?: number | null
          approved_date?: string | null
          approver_email?: string
          approver_name?: string | null
          client_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          level?: number
          level_name?: string | null
          notification_sent?: boolean | null
          request_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_approval_request"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sup_supply_request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sup_approval_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_approval_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_approval_flow: {
        Row: {
          category_code: string | null
          client_id: string
          created_at: string | null
          department_code: string | null
          description: string | null
          id: string
          is_active: boolean | null
          levels: Json
          max_amount: number | null
          min_amount: number | null
          name: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          category_code?: string | null
          client_id: string
          created_at?: string | null
          department_code?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          levels?: Json
          max_amount?: number | null
          min_amount?: number | null
          name: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string | null
          client_id?: string
          created_at?: string | null
          department_code?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          levels?: Json
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_approval_flow_category"
            columns: ["client_id", "category_code"]
            isOneToOne: false
            referencedRelation: "sup_category"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_approval_flow_department"
            columns: ["client_id", "department_code"]
            isOneToOne: false
            referencedRelation: "sup_department"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_sup_approval_flow_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_approval_flow_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_budget: {
        Row: {
          available_amount: number | null
          category_code: string | null
          client_id: string
          committed_amount: number | null
          created_at: string | null
          currency: string | null
          department_code: string | null
          id: string
          is_active: boolean | null
          name: string
          spent_amount: number | null
          total_budget: number
          updated_at: string | null
          year: number
        }
        Insert: {
          available_amount?: number | null
          category_code?: string | null
          client_id: string
          committed_amount?: number | null
          created_at?: string | null
          currency?: string | null
          department_code?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          spent_amount?: number | null
          total_budget: number
          updated_at?: string | null
          year: number
        }
        Update: {
          available_amount?: number | null
          category_code?: string | null
          client_id?: string
          committed_amount?: number | null
          created_at?: string | null
          currency?: string | null
          department_code?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          spent_amount?: number | null
          total_budget?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_budget_category"
            columns: ["client_id", "category_code"]
            isOneToOne: false
            referencedRelation: "sup_category"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_budget_department"
            columns: ["client_id", "department_code"]
            isOneToOne: false
            referencedRelation: "sup_department"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_sup_budget_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_budget_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_category: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sup_category_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_category_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_cost_center: {
        Row: {
          budget: number | null
          client_id: string
          code: string
          created_at: string | null
          department_code: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_id: string
          code: string
          created_at?: string | null
          department_code?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_id?: string
          code?: string
          created_at?: string | null
          department_code?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cost_center_department"
            columns: ["client_id", "department_code"]
            isOneToOne: false
            referencedRelation: "sup_department"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_sup_cost_center_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_cost_center_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_department: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          manager_email: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sup_department_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_department_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_holiday: {
        Row: {
          client_id: string
          created_at: string | null
          holiday_date: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          holiday_date: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          holiday_date?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sup_holiday_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_holiday_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_priority: {
        Row: {
          client_id: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sup_priority_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_priority_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_request_history: {
        Row: {
          action_type: string
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          level: number | null
          new_value: string | null
          old_value: string | null
          performed_by: string
          request_id: string
        }
        Insert: {
          action_type: string
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          level?: number | null
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          request_id: string
        }
        Update: {
          action_type?: string
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          level?: number | null
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_history_request"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sup_supply_request"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sup_request_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_request_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_supplier: {
        Row: {
          address: string | null
          categories: string[] | null
          city: string | null
          client_id: string
          created_at: string | null
          delivery_time_days: number | null
          document_number: string | null
          email: string
          id: string
          is_active: boolean | null
          legal_name: string | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          rating: number | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          categories?: string[] | null
          city?: string | null
          client_id: string
          created_at?: string | null
          delivery_time_days?: number | null
          document_number?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          categories?: string[] | null
          city?: string | null
          client_id?: string
          created_at?: string | null
          delivery_time_days?: number | null
          document_number?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sup_supplier_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_supplier_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_supply_item: {
        Row: {
          category_code: string | null
          client_id: string
          created_at: string | null
          current_stock: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock: number | null
          name: string
          sku: string | null
          specifications: string | null
          supplier_id: string | null
          supplier_name: string | null
          unit: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category_code?: string | null
          client_id: string
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          name: string
          sku?: string | null
          specifications?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          unit: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string | null
          client_id?: string
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          name?: string
          sku?: string | null
          specifications?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sup_supply_item_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_supply_item_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_supply_item_category"
            columns: ["client_id", "category_code"]
            isOneToOne: false
            referencedRelation: "sup_category"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_supply_item_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "sup_supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      sup_supply_request: {
        Row: {
          approval_flow_id: string | null
          attachments: string[] | null
          category_code: string
          client_id: string
          cost_center_code: string | null
          created_at: string | null
          currency: string | null
          current_approval_level: number | null
          department_code: string
          description: string
          expected_delivery_date: string | null
          id: string
          items: Json
          justification: string | null
          notes: string | null
          priority_code: string | null
          purchase_order_number: string | null
          received_date: string | null
          request_number: string | null
          requester_email: string
          requester_name: string | null
          status: string | null
          title: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          approval_flow_id?: string | null
          attachments?: string[] | null
          category_code: string
          client_id: string
          cost_center_code?: string | null
          created_at?: string | null
          currency?: string | null
          current_approval_level?: number | null
          department_code: string
          description: string
          expected_delivery_date?: string | null
          id?: string
          items?: Json
          justification?: string | null
          notes?: string | null
          priority_code?: string | null
          purchase_order_number?: string | null
          received_date?: string | null
          request_number?: string | null
          requester_email: string
          requester_name?: string | null
          status?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_flow_id?: string | null
          attachments?: string[] | null
          category_code?: string
          client_id?: string
          cost_center_code?: string | null
          created_at?: string | null
          currency?: string | null
          current_approval_level?: number | null
          department_code?: string
          description?: string
          expected_delivery_date?: string | null
          id?: string
          items?: Json
          justification?: string | null
          notes?: string | null
          priority_code?: string | null
          purchase_order_number?: string | null
          received_date?: string | null
          request_number?: string | null
          requester_email?: string
          requester_name?: string | null
          status?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_request_approval_flow"
            columns: ["approval_flow_id"]
            isOneToOne: false
            referencedRelation: "sup_approval_flow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_request_category"
            columns: ["client_id", "category_code"]
            isOneToOne: false
            referencedRelation: "sup_category"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_request_cost_center"
            columns: ["client_id", "cost_center_code"]
            isOneToOne: false
            referencedRelation: "sup_cost_center"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_request_department"
            columns: ["client_id", "department_code"]
            isOneToOne: false
            referencedRelation: "sup_department"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_request_priority"
            columns: ["client_id", "priority_code"]
            isOneToOne: false
            referencedRelation: "sup_priority"
            referencedColumns: ["client_id", "code"]
          },
          {
            foreignKeyName: "fk_sup_supply_request_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_supply_request_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_system_setting: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sup_system_setting_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_system_setting_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
      sup_work_calendar: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          work_days: number[]
          work_end_time: string
          work_start_time: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          work_days: number[]
          work_end_time: string
          work_start_time: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          work_days?: number[]
          work_end_time?: string
          work_start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sup_work_calendar_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bmr_client"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "fk_sup_work_calendar_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vinv_compliance_metrics"
            referencedColumns: ["client_id"]
          },
        ]
      }
    }
    Views: {
      vbmr_user_permissions: {
        Row: {
          can_approve: boolean | null
          can_edit_all: boolean | null
          email: string | null
          is_read_only: boolean | null
          name: string | null
          permission_level: string | null
          profile: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bmr_user_system_access_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bmr_user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vinv_compliance_metrics: {
        Row: {
          assets_warranty_expired: number | null
          client_id: string | null
          critical_vulnerabilities: number | null
          expired_contracts: number | null
          expired_licenses: number | null
          high_vulnerabilities: number | null
          name: string | null
          open_vulnerabilities: number | null
          overallocated_licenses: number | null
          total_assets: number | null
          total_contracts: number | null
          total_software: number | null
          total_vulnerabilities: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      authenticate_user: {
        Args: { p_email: string; p_password: string }
        Returns: {
          email: string
          is_active: boolean
          is_super_admin: boolean
          name: string
          user_id: string
        }[]
      }
      calculate_progress_percentage: {
        Args: { p_completed: number; p_total: number }
        Returns: number
      }
      complete_planning_poker_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      create_user_with_encrypted_password:
        | {
            Args: {
              p_avatar_url?: string
              p_client_id: string
              p_email: string
              p_is_active?: boolean
              p_name: string
              p_password: string
            }
            Returns: string
          }
        | {
            Args: {
              p_client_id: string
              p_email: string
              p_is_active?: boolean
              p_name: string
              p_password: string
            }
            Returns: string
          }
      delete_project_category: {
        Args: { p_id: string; p_user_id: string }
        Returns: boolean
      }
      delete_story_type: {
        Args: { p_id: string; p_user_id: string }
        Returns: boolean
      }
      delete_task_type: {
        Args: { p_id: string; p_user_id: string }
        Returns: boolean
      }
      delete_team: {
        Args: { p_id: string; p_user_id: string }
        Returns: boolean
      }
      get_current_client_id: { Args: never; Returns: string }
      get_current_user_email: { Args: never; Returns: string }
      get_current_user_id: { Args: never; Returns: string }
      get_secret_value: { Args: { p_key: string }; Returns: string }
      get_session_user_id: { Args: never; Returns: string }
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      get_user_clients: {
        Args: { _user_id: string }
        Returns: {
          client_id: string
          is_primary: boolean
        }[]
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_project_category: {
        Args: {
          p_client_id?: string
          p_code: string
          p_color?: string
          p_description?: string
          p_icon?: string
          p_is_active?: boolean
          p_name: string
          p_order?: number
          p_user_id: string
        }
        Returns: Json
      }
      insert_story_type: {
        Args: {
          p_client_id?: string
          p_code: string
          p_color?: string
          p_description?: string
          p_icon?: string
          p_is_active?: boolean
          p_name: string
          p_order?: number
          p_user_id: string
        }
        Returns: Json
      }
      insert_task_type: {
        Args: {
          p_client_id?: string
          p_code: string
          p_color?: string
          p_description?: string
          p_icon?: string
          p_is_active?: boolean
          p_name: string
          p_order?: number
          p_user_id: string
        }
        Returns: Json
      }
      insert_team: {
        Args: {
          p_client_id?: string
          p_code: string
          p_color?: string
          p_description?: string
          p_icon?: string
          p_is_active?: boolean
          p_name: string
          p_order?: number
          p_user_id: string
        }
        Returns: Json
      }
      is_session_super_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_resend_email_attempt: {
        Args: {
          p_client_id?: string
          p_error_message?: string
          p_recipient_email: string
          p_status: string
          p_subject: string
        }
        Returns: undefined
      }
      send_email_via_resend: {
        Args: {
          p_api_key?: string
          p_client_id?: string
          p_from?: string
          p_html: string
          p_subject: string
          p_text?: string
          p_to: string
        }
        Returns: Json
      }
      send_email_via_resend_secure: {
        Args: {
          p_client_id?: string
          p_from?: string
          p_html: string
          p_subject: string
          p_text?: string
          p_to: string
        }
        Returns: Json
      }
      set_session_client_id: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      set_session_user_id: { Args: { p_user_id: string }; Returns: undefined }
      set_session_variables: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: undefined
      }
      set_user_client_id: { Args: { p_client_id: string }; Returns: undefined }
      update_project_category: {
        Args: {
          p_code: string
          p_color?: string
          p_description?: string
          p_icon?: string
          p_id: string
          p_is_active?: boolean
          p_name: string
          p_order?: number
          p_user_id: string
        }
        Returns: Json
      }
      update_story_type: {
        Args: {
          p_code: string
          p_color?: string
          p_description?: string
          p_icon?: string
          p_id: string
          p_is_active?: boolean
          p_name: string
          p_order?: number
          p_user_id: string
        }
        Returns: Json
      }
      update_task_type: {
        Args: {
          p_code: string
          p_color?: string
          p_description?: string
          p_icon?: string
          p_id: string
          p_is_active?: boolean
          p_name: string
          p_order?: number
          p_user_id: string
        }
        Returns: Json
      }
      update_team: {
        Args: {
          p_code: string
          p_color?: string
          p_description?: string
          p_icon?: string
          p_id: string
          p_is_active?: boolean
          p_name: string
          p_order?: number
          p_user_id: string
        }
        Returns: Json
      }
      update_user_client_associations: {
        Args: {
          p_client_ids: string[]
          p_current_user_id: string
          p_primary_client_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_user_password: {
        Args: { p_new_password: string; p_user_id: string }
        Returns: boolean
      }
      update_user_with_encrypted_password:
        | {
            Args: {
              p_avatar_url?: string
              p_client_id: string
              p_email: string
              p_is_active?: boolean
              p_name: string
              p_password?: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_client_id: string
              p_email: string
              p_is_active?: boolean
              p_name: string
              p_password?: string
              p_user_id: string
            }
            Returns: undefined
          }
    }
    Enums: {
      alert_severity: "critica" | "alta" | "media" | "baixa"
      alert_type: "manutencao" | "licenca" | "contrato" | "estoque" | "garantia"
      app_role: "admin" | "gestor" | "tecnico" | "usuario"
      asset_status: "disponivel" | "em_uso" | "manutencao" | "descartado"
      contract_status: "ativo" | "expirado" | "cancelado"
      license_type: "perpetua" | "assinatura" | "trial"
      maintenance_status:
        | "agendada"
        | "em_andamento"
        | "concluida"
        | "cancelada"
      maintenance_type: "preventiva" | "corretiva" | "preditiva"
      vulnerability_severity: "critica" | "alta" | "media" | "baixa"
      vulnerability_status:
        | "aberta"
        | "em_analise"
        | "em_remediacao"
        | "resolvida"
        | "aceita"
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
      alert_severity: ["critica", "alta", "media", "baixa"],
      alert_type: ["manutencao", "licenca", "contrato", "estoque", "garantia"],
      app_role: ["admin", "gestor", "tecnico", "usuario"],
      asset_status: ["disponivel", "em_uso", "manutencao", "descartado"],
      contract_status: ["ativo", "expirado", "cancelado"],
      license_type: ["perpetua", "assinatura", "trial"],
      maintenance_status: [
        "agendada",
        "em_andamento",
        "concluida",
        "cancelada",
      ],
      maintenance_type: ["preventiva", "corretiva", "preditiva"],
      vulnerability_severity: ["critica", "alta", "media", "baixa"],
      vulnerability_status: [
        "aberta",
        "em_analise",
        "em_remediacao",
        "resolvida",
        "aceita",
      ],
    },
  },
} as const
