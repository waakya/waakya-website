// Generated from the live schema with the Supabase types generator.
// Regenerate with scripts/gen-types.sh after every migration; never hand-edit.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approver_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          details: string | null
          document_id: string | null
          id: string
          org_id: string
          project_id: string | null
          requested_by: string
          status: Database["public"]["Enums"]["approval_status"]
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approver_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          details?: string | null
          document_id?: string | null
          id?: string
          org_id: string
          project_id?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["approval_status"]
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approver_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          details?: string | null
          document_id?: string | null
          id?: string
          org_id?: string
          project_id?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["approval_status"]
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string
          id: string
          leave_request_id: string | null
          note: string | null
          org_id: string
          punch_in_at: string | null
          punch_out_at: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          leave_request_id?: string | null
          note?: string | null
          org_id: string
          punch_in_at?: string | null
          punch_out_at?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          created_at?: string
          id?: string
          leave_request_id?: string | null
          note?: string | null
          org_id?: string
          punch_in_at?: string | null
          punch_out_at?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          org_id: string
          position: number
          proof_required: boolean
          title: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          org_id: string
          position?: number
          proof_required?: boolean
          title: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          org_id?: string
          position?: number
          proof_required?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          active: boolean
          assigned_to: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          org_id: string
          run_at: string
          window_minutes: number
        }
        Insert: {
          active?: boolean
          assigned_to?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          org_id: string
          run_at?: string
          window_minutes?: number
        }
        Update: {
          active?: boolean
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          org_id?: string
          run_at?: string
          window_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "checklists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          org_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          org_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["conversation_kind"]
          last_message_at: string
          org_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kind?: Database["public"]["Enums"]["conversation_kind"]
          last_message_at?: string
          org_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["conversation_kind"]
          last_message_at?: string
          org_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          actor_id: string | null
          actor_kind: string
          body: string | null
          campaign_id: string | null
          contact_id: string
          created_at: string
          id: string
          kind: string
          metadata: Json
          occurred_at: string
          opportunity_id: string | null
          org_id: string
          task_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_kind?: string
          body?: string | null
          campaign_id?: string | null
          contact_id: string
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          occurred_at?: string
          opportunity_id?: string | null
          org_id: string
          task_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_kind?: string
          body?: string | null
          campaign_id?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          occurred_at?: string
          opportunity_id?: string | null
          org_id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          archived_at: string | null
          company_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          email_opt_out: boolean
          external_ref: string | null
          full_name: string
          id: string
          kind: string
          last_activity_at: string | null
          metadata: Json
          next_action_at: string | null
          next_action_note: string | null
          notes: string | null
          org_id: string
          owner_id: string | null
          phone_e164: string | null
          project_id: string | null
          source: string | null
          tags: string[]
          updated_at: string
          whatsapp_opt_out: boolean
        }
        Insert: {
          archived_at?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          email_opt_out?: boolean
          external_ref?: string | null
          full_name: string
          id?: string
          kind?: string
          last_activity_at?: string | null
          metadata?: Json
          next_action_at?: string | null
          next_action_note?: string | null
          notes?: string | null
          org_id: string
          owner_id?: string | null
          phone_e164?: string | null
          project_id?: string | null
          source?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_opt_out?: boolean
        }
        Update: {
          archived_at?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          email_opt_out?: boolean
          external_ref?: string | null
          full_name?: string
          id?: string
          kind?: string
          last_activity_at?: string | null
          metadata?: Json
          next_action_at?: string | null
          next_action_note?: string | null
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          phone_e164?: string | null
          project_id?: string | null
          source?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_opt_out?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          closed_at: string | null
          contact_id: string
          created_at: string
          created_by: string | null
          expected_close: string | null
          id: string
          org_id: string
          owner_id: string | null
          pipeline_id: string
          project_id: string | null
          record_id: string | null
          source: string | null
          stage_id: string
          status: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          closed_at?: string | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          expected_close?: string | null
          id?: string
          org_id: string
          owner_id?: string | null
          pipeline_id: string
          project_id?: string | null
          record_id?: string | null
          source?: string | null
          stage_id: string
          status?: string
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          closed_at?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          expected_close?: string | null
          id?: string
          org_id?: string
          owner_id?: string | null
          pipeline_id?: string
          project_id?: string | null
          record_id?: string | null
          source?: string | null
          stage_id?: string
          status?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opps_record_fk"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          created_at: string
          id: string
          key: string
          kind: string
          name: string
          org_id: string
          pipeline_id: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          kind?: string
          name: string
          org_id: string
          pipeline_id: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          kind?: string
          name?: string
          org_id?: string
          pipeline_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_access: {
        Row: {
          accepted_at: string | null
          contact_id: string
          email: string | null
          id: string
          invite_token: string
          invited_at: string
          invited_by: string | null
          last_seen_at: string | null
          org_id: string
          phone_e164: string | null
          revoked_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          contact_id: string
          email?: string | null
          id?: string
          invite_token: string
          invited_at?: string
          invited_by?: string | null
          last_seen_at?: string | null
          org_id: string
          phone_e164?: string | null
          revoked_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          contact_id?: string
          email?: string | null
          id?: string
          invite_token?: string
          invited_at?: string
          invited_by?: string | null
          last_seen_at?: string | null
          org_id?: string
          phone_e164?: string | null
          revoked_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_access_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_access_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_decisions: {
        Row: {
          blocks_record_id: string | null
          blocks_task_id: string | null
          created_at: string
          decided_at: string | null
          decided_by_access_id: string | null
          decided_by_user_id: string | null
          decided_note: string | null
          decided_option_key: string | null
          description: string | null
          id: string
          options: Json
          org_id: string
          project_id: string
          requested_by: string | null
          status: string
          title: string
          unblock_record_status: string | null
        }
        Insert: {
          blocks_record_id?: string | null
          blocks_task_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by_access_id?: string | null
          decided_by_user_id?: string | null
          decided_note?: string | null
          decided_option_key?: string | null
          description?: string | null
          id?: string
          options: Json
          org_id: string
          project_id: string
          requested_by?: string | null
          status?: string
          title: string
          unblock_record_status?: string | null
        }
        Update: {
          blocks_record_id?: string | null
          blocks_task_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by_access_id?: string | null
          decided_by_user_id?: string | null
          decided_note?: string | null
          decided_option_key?: string | null
          description?: string | null
          id?: string
          options?: Json
          org_id?: string
          project_id?: string
          requested_by?: string | null
          status?: string
          title?: string
          unblock_record_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_decisions_blocks_record_id_fkey"
            columns: ["blocks_record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_decisions_blocks_task_id_fkey"
            columns: ["blocks_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_decisions_decided_by_access_id_fkey"
            columns: ["decided_by_access_id"]
            isOneToOne: false
            referencedRelation: "customer_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_decisions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_messages: {
        Row: {
          author_kind: string
          author_user_id: string | null
          body: string
          created_at: string
          customer_access_id: string | null
          id: string
          org_id: string
          project_id: string
          read_by_business_at: string | null
        }
        Insert: {
          author_kind: string
          author_user_id?: string | null
          body: string
          created_at?: string
          customer_access_id?: string | null
          id?: string
          org_id: string
          project_id: string
          read_by_business_at?: string | null
        }
        Update: {
          author_kind?: string
          author_user_id?: string | null
          body?: string
          created_at?: string
          customer_access_id?: string | null
          id?: string
          org_id?: string
          project_id?: string
          read_by_business_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_messages_customer_access_id_fkey"
            columns: ["customer_access_id"]
            isOneToOne: false
            referencedRelation: "customer_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_project_access: {
        Row: {
          created_at: string
          customer_access_id: string
          granted_by: string | null
          id: string
          org_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          customer_access_id: string
          granted_by?: string | null
          id?: string
          org_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          customer_access_id?: string
          granted_by?: string | null
          id?: string
          org_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_project_access_customer_access_id_fkey"
            columns: ["customer_access_id"]
            isOneToOne: false
            referencedRelation: "customer_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_project_access_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          customer_visible: boolean
          id: string
          message_id: string | null
          mime_type: string | null
          name: string
          org_id: string
          project_id: string | null
          size_bytes: number | null
          source: string
          storage_key: string
          task_id: string | null
          template_data: Json | null
          template_key: string | null
          uploaded_by: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          customer_visible?: boolean
          id?: string
          message_id?: string | null
          mime_type?: string | null
          name: string
          org_id: string
          project_id?: string | null
          size_bytes?: number | null
          source?: string
          storage_key: string
          task_id?: string | null
          template_data?: Json | null
          template_key?: string | null
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          customer_visible?: boolean
          id?: string
          message_id?: string | null
          mime_type?: string | null
          name?: string
          org_id?: string
          project_id?: string | null
          size_bytes?: number | null
          source?: string
          storage_key?: string
          task_id?: string | null
          template_data?: Json | null
          template_key?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_events: {
        Row: {
          actor_id: string | null
          actor_kind: string
          depth: number
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          occurred_at: string
          org_id: string
          payload: Json
          processed_at: string | null
          processing_attempts: number
        }
        Insert: {
          actor_id?: string | null
          actor_kind?: string
          depth?: number
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          occurred_at?: string
          org_id: string
          payload?: Json
          processed_at?: string | null
          processing_attempts?: number
        }
        Update: {
          actor_id?: string | null
          actor_kind?: string
          depth?: number
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          occurred_at?: string
          org_id?: string
          payload?: Json
          processed_at?: string | null
          processing_attempts?: number
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          id: string
          notified_user: string | null
          org_id: string
          reason: string
          task_id: string
          triggered_at: string
        }
        Insert: {
          id?: string
          notified_user?: string | null
          org_id: string
          reason: string
          task_id: string
          triggered_at?: string
        }
        Update: {
          id?: string
          notified_user?: string | null
          org_id?: string
          reason?: string
          task_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string
          holiday_date: string
          id: string
          org_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          holiday_date: string
          id?: string
          org_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          holiday_date?: string
          id?: string
          org_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          expires_at: string
          full_name: string
          id: string
          org_id: string
          phone: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          expires_at?: string
          full_name: string
          id?: string
          org_id: string
          phone: string
          role?: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          full_name?: string
          id?: string
          org_id?: string
          phone?: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          balance_days: number
          created_at: string
          id: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_days?: number
          created_at?: string
          id?: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_days?: number
          created_at?: string
          id?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          days_requested: number
          end_date: string
          half_day_period: Database["public"]["Enums"]["day_half"] | null
          id: string
          org_id: string
          reason: string | null
          request_type: Database["public"]["Enums"]["leave_kind"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_requested: number
          end_date: string
          half_day_period?: Database["public"]["Enums"]["day_half"] | null
          id?: string
          org_id: string
          reason?: string | null
          request_type?: Database["public"]["Enums"]["leave_kind"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_requested?: number
          end_date?: string
          half_day_period?: Database["public"]["Enums"]["day_half"] | null
          id?: string
          org_id?: string
          reason?: string | null
          request_type?: Database["public"]["Enums"]["leave_kind"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          body: string
          conversation_id: string
          created_at: string
          id: string
          org_id: string
        }
        Insert: {
          author_id: string
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          org_id: string
        }
        Update: {
          author_id?: string
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dedupe_key: string | null
          event: string
          href: string | null
          id: string
          org_id: string
          read_at: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          event: string
          href?: string | null
          id?: string
          org_id: string
          read_at?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          event?: string
          href?: string | null
          id?: string
          org_id?: string
          read_at?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_modules: {
        Row: {
          configuration: Json
          created_at: string
          disabled_at: string | null
          enabled: boolean
          enabled_at: string | null
          enabled_by: string | null
          id: string
          module_key: string
          org_id: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          disabled_at?: string | null
          enabled?: boolean
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_key: string
          org_id: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          disabled_at?: string | null
          enabled?: boolean
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_key?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_modules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          ack_minutes: number
          address: string | null
          created_at: string
          created_by: string
          email: string | null
          gstin: string | null
          id: string
          language: string
          name: string
          phone: string | null
          quiet_end: string
          quiet_start: string
        }
        Insert: {
          ack_minutes?: number
          address?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          gstin?: string | null
          id?: string
          language?: string
          name: string
          phone?: string | null
          quiet_end?: string
          quiet_start?: string
        }
        Update: {
          ack_minutes?: number
          address?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          gstin?: string | null
          id?: string
          language?: string
          name?: string
          phone?: string | null
          quiet_end?: string
          quiet_start?: string
        }
        Relationships: []
      }
      otp_requests: {
        Row: {
          created_at: string
          id: string
          identifier_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier_hash?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          language: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          language?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          created_at: string
          created_by: string | null
          customer_visible: boolean
          done_at: string | null
          due_date: string | null
          id: string
          name: string
          org_id: string
          position: number
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          name: string
          org_id: string
          position?: number
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          done_at?: string | null
          due_date?: string | null
          id?: string
          name?: string
          org_id?: string
          position?: number
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          actor_kind: string
          body: string
          created_at: string
          created_by: string | null
          customer_visible: boolean
          id: string
          kind: string
          org_id: string
          project_id: string
          source_event_id: string | null
        }
        Insert: {
          actor_kind?: string
          body: string
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          id?: string
          kind?: string
          org_id: string
          project_id: string
          source_event_id?: string | null
        }
        Update: {
          actor_kind?: string
          body?: string
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          id?: string
          kind?: string
          org_id?: string
          project_id?: string
          source_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "domain_events"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string
          customer_summary: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          org_id: string
          progress_percent: number
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by: string
          customer_summary?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          org_id: string
          progress_percent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string
          customer_summary?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          org_id?: string
          progress_percent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      proofs: {
        Row: {
          body: string | null
          created_at: string
          created_by: string
          customer_visible: boolean
          id: string
          kind: string
          org_id: string
          task_id: string
          url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by: string
          customer_visible?: boolean
          id?: string
          kind?: string
          org_id: string
          task_id: string
          url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string
          customer_visible?: boolean
          id?: string
          kind?: string
          org_id?: string
          task_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proofs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      record_fields: {
        Row: {
          archived_at: string | null
          created_at: string
          customer_visible: boolean
          field_type: string
          id: string
          key: string
          label: string
          options: Json
          org_id: string
          position: number
          record_type_id: string
          required: boolean
          show_in_list: boolean
          unit: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          customer_visible?: boolean
          field_type: string
          id?: string
          key: string
          label: string
          options?: Json
          org_id: string
          position?: number
          record_type_id: string
          required?: boolean
          show_in_list?: boolean
          unit?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          customer_visible?: boolean
          field_type?: string
          id?: string
          key?: string
          label?: string
          options?: Json
          org_id?: string
          position?: number
          record_type_id?: string
          required?: boolean
          show_in_list?: boolean
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "record_fields_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_fields_record_type_id_fkey"
            columns: ["record_type_id"]
            isOneToOne: false
            referencedRelation: "record_types"
            referencedColumns: ["id"]
          },
        ]
      }
      record_types: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          customer_visible_default: boolean
          default_status: string | null
          description: string | null
          icon: string | null
          id: string
          key: string
          name: string
          name_plural: string
          org_id: string
          statuses: Json
          template_key: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_visible_default?: boolean
          default_status?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          name: string
          name_plural: string
          org_id: string
          statuses?: Json
          template_key?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_visible_default?: boolean
          default_status?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          name?: string
          name_plural?: string
          org_id?: string
          statuses?: Json
          template_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      records: {
        Row: {
          archived_at: string | null
          assignee_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          customer_visible: boolean
          id: string
          org_id: string
          project_id: string | null
          record_type_id: string
          sort_key: number | null
          status_key: string | null
          title: string
          updated_at: string
          updated_by: string | null
          values: Json
          vendor_id: string | null
        }
        Insert: {
          archived_at?: string | null
          assignee_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          id?: string
          org_id: string
          project_id?: string | null
          record_type_id: string
          sort_key?: number | null
          status_key?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          values?: Json
          vendor_id?: string | null
        }
        Update: {
          archived_at?: string | null
          assignee_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          id?: string
          org_id?: string
          project_id?: string | null
          record_type_id?: string
          sort_key?: number | null
          status_key?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          values?: Json
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "records_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_record_type_id_fkey"
            columns: ["record_type_id"]
            isOneToOne: false
            referencedRelation: "record_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_vendor_fk"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_state: Database["public"]["Enums"]["task_state"] | null
          id: string
          note: string | null
          org_id: string
          task_id: string
          to_state: Database["public"]["Enums"]["task_state"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_state?: Database["public"]["Enums"]["task_state"] | null
          id?: string
          note?: string | null
          org_id: string
          task_id: string
          to_state: Database["public"]["Enums"]["task_state"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_state?: Database["public"]["Enums"]["task_state"] | null
          id?: string
          note?: string | null
          org_id?: string
          task_id?: string
          to_state?: Database["public"]["Enums"]["task_state"]
        }
        Relationships: [
          {
            foreignKeyName: "task_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          org_id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          org_id: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          org_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          accepted_at: string | null
          ack_minutes: number | null
          acknowledged_at: string | null
          assigned_to: string | null
          blocked_by_decision_id: string | null
          cancelled_at: string | null
          checklist_date: string | null
          checklist_item_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          delivered_at: string | null
          details: string | null
          done_at: string | null
          due_at: string | null
          id: string
          opportunity_id: string | null
          org_id: string
          origin_id: string | null
          origin_kind: string
          origin_label: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          proof_required: boolean
          record_id: string | null
          source_message_id: string | null
          started_at: string | null
          state: Database["public"]["Enums"]["task_state"]
          title: string
          updated_at: string
          vendor_assignment_id: string | null
          verified_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          ack_minutes?: number | null
          acknowledged_at?: string | null
          assigned_to?: string | null
          blocked_by_decision_id?: string | null
          cancelled_at?: string | null
          checklist_date?: string | null
          checklist_item_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          delivered_at?: string | null
          details?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          opportunity_id?: string | null
          org_id: string
          origin_id?: string | null
          origin_kind?: string
          origin_label?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          proof_required?: boolean
          record_id?: string | null
          source_message_id?: string | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["task_state"]
          title: string
          updated_at?: string
          vendor_assignment_id?: string | null
          verified_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          ack_minutes?: number | null
          acknowledged_at?: string | null
          assigned_to?: string | null
          blocked_by_decision_id?: string | null
          cancelled_at?: string | null
          checklist_date?: string | null
          checklist_item_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          details?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          opportunity_id?: string | null
          org_id?: string
          origin_id?: string | null
          origin_kind?: string
          origin_label?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          proof_required?: boolean
          record_id?: string | null
          source_message_id?: string | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["task_state"]
          title?: string
          updated_at?: string
          vendor_assignment_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_blocked_by_decision_id_fkey"
            columns: ["blocked_by_decision_id"]
            isOneToOne: false
            referencedRelation: "customer_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_vendor_assignment_id_fkey"
            columns: ["vendor_assignment_id"]
            isOneToOne: false
            referencedRelation: "vendor_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_assignments: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          customer_visible: boolean
          details: string | null
          due_date: string | null
          execution_status: string
          id: string
          org_id: string
          payment_status: string
          project_id: string | null
          record_id: string | null
          record_status_on_submit: string | null
          record_status_on_verify: string | null
          rejection_note: string | null
          started_at: string | null
          submitted_at: string | null
          submitted_note: string | null
          task_id: string | null
          title: string
          updated_at: string
          vendor_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          details?: string | null
          due_date?: string | null
          execution_status?: string
          id?: string
          org_id: string
          payment_status?: string
          project_id?: string | null
          record_id?: string | null
          record_status_on_submit?: string | null
          record_status_on_verify?: string | null
          rejection_note?: string | null
          started_at?: string | null
          submitted_at?: string | null
          submitted_note?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
          vendor_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_visible?: boolean
          details?: string | null
          due_date?: string | null
          execution_status?: string
          id?: string
          org_id?: string
          payment_status?: string
          project_id?: string | null
          record_id?: string | null
          record_status_on_submit?: string | null
          record_status_on_verify?: string | null
          rejection_note?: string | null
          started_at?: string | null
          submitted_at?: string | null
          submitted_note?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
          vendor_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_assignments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payments: {
        Row: {
          amount: number
          assignment_id: string
          created_at: string
          id: string
          note: string | null
          org_id: string
          paid_at: string
          recorded_by: string | null
        }
        Insert: {
          amount: number
          assignment_id: string
          created_at?: string
          id?: string
          note?: string | null
          org_id: string
          paid_at?: string
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          assignment_id?: string
          created_at?: string
          id?: string
          note?: string | null
          org_id?: string
          paid_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "vendor_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone_e164: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone_e164?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone_e164?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_customer_invite: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string | null
          contact_id: string
          email: string | null
          id: string
          invite_token: string
          invited_at: string
          invited_by: string | null
          last_seen_at: string | null
          org_id: string
          phone_e164: string | null
          revoked_at: string | null
          status: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "customer_access"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_invite: { Args: { p_token: string }; Returns: string }
      add_holiday: {
        Args: { p_date: string; p_org: string; p_title: string }
        Returns: {
          created_at: string
          created_by: string
          holiday_date: string
          id: string
          org_id: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "holidays"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_leave: {
        Args: {
          p_end: string
          p_kind?: Database["public"]["Enums"]["leave_kind"]
          p_org: string
          p_period?: Database["public"]["Enums"]["day_half"]
          p_reason?: string
          p_start: string
        }
        Returns: {
          created_at: string
          days_requested: number
          end_date: string
          half_day_period: Database["public"]["Enums"]["day_half"] | null
          id: string
          org_id: string
          reason: string | null
          request_type: Database["public"]["Enums"]["leave_kind"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "leave_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_group_conversation: {
        Args: { p_members: string[]; p_org: string; p_title: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["conversation_kind"]
          last_message_at: string
          org_id: string
          title: string | null
        }
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_org: {
        Args: { p_language?: string; p_name: string }
        Returns: string
      }
      credit_leave: {
        Args: { p_days: number; p_org: string; p_user: string }
        Returns: {
          balance_days: number
          created_at: string
          id: string
          org_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "leave_balances"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_install_default_pipeline: { Args: { p_org: string }; Returns: string }
      crm_move_opportunity: {
        Args: { p_note?: string; p_opportunity: string; p_stage: string }
        Returns: {
          closed_at: string | null
          contact_id: string
          created_at: string
          created_by: string | null
          expected_close: string | null
          id: string
          org_id: string
          owner_id: string | null
          pipeline_id: string
          project_id: string | null
          record_id: string | null
          source: string | null
          stage_id: string
          status: string
          title: string
          updated_at: string
          value: number | null
        }
        SetofOptions: {
          from: "*"
          to: "crm_opportunities"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_upsert_lead: {
        Args: {
          p_actor_kind?: string
          p_email?: string
          p_full_name: string
          p_idempotency?: string
          p_interest?: string
          p_message?: string
          p_metadata?: Json
          p_org: string
          p_owner?: string
          p_phone?: string
          p_source?: string
        }
        Returns: {
          contact_id: string
          deduplicated: boolean
          opportunity_id: string
        }[]
      }
      decide_approval: {
        Args: { p_approval: string; p_approve: boolean; p_note?: string }
        Returns: {
          approver_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          details: string | null
          document_id: string | null
          id: string
          org_id: string
          project_id: string | null
          requested_by: string
          status: Database["public"]["Enums"]["approval_status"]
          task_id: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "approvals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      decide_leave_request: {
        Args: { p_approve: boolean; p_note?: string; p_request: string }
        Returns: {
          created_at: string
          days_requested: number
          end_date: string
          half_day_period: Database["public"]["Enums"]["day_half"] | null
          id: string
          org_id: string
          reason: string | null
          request_type: Database["public"]["Enums"]["leave_kind"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "leave_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      display_name: { Args: { p_user: string }; Returns: string }
      install_record_type: {
        Args: {
          p_customer_visible_default: boolean
          p_default_status: string
          p_description: string
          p_fields: Json
          p_icon: string
          p_key: string
          p_name: string
          p_name_plural: string
          p_org: string
          p_statuses: Json
          p_template_key: string
        }
        Returns: string
      }
      invite_preview: {
        Args: { p_token: string }
        Returns: {
          already_accepted: boolean
          full_name: string
          org_language: string
          org_name: string
        }[]
      }
      is_conversation_participant: {
        Args: { p_conversation: string }
        Returns: boolean
      }
      is_customer_of_org: { Args: { p_org: string }; Returns: boolean }
      is_org_admin: { Args: { p_org: string }; Returns: boolean }
      is_org_member: { Args: { p_org: string }; Returns: boolean }
      is_org_owner_admin: { Args: { p_org: string }; Returns: boolean }
      is_project_customer: { Args: { p_project: string }; Returns: boolean }
      is_system_write: { Args: never; Returns: boolean }
      ist_today: { Args: never; Returns: string }
      leave_days_between: {
        Args: {
          p_end: string
          p_kind: Database["public"]["Enums"]["leave_kind"]
          p_org: string
          p_start: string
        }
        Returns: number
      }
      mark_conversation_read: {
        Args: { p_conversation: string }
        Returns: undefined
      }
      module_default_enabled: { Args: { p_key: string }; Returns: boolean }
      module_is_core: { Args: { p_key: string }; Returns: boolean }
      my_customer_access: {
        Args: never
        Returns: {
          access_id: string
          contact_name: string
          org_id: string
          org_name: string
          project_id: string
          project_name: string
        }[]
      }
      org_member_email: { Args: { p_user: string }; Returns: string }
      org_module_enabled: {
        Args: { p_key: string; p_org: string }
        Returns: boolean
      }
      org_role: {
        Args: { p_org: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      post_customer_message: {
        Args: { p_body: string; p_project: string }
        Returns: {
          author_kind: string
          author_user_id: string | null
          body: string
          created_at: string
          customer_access_id: string | null
          id: string
          org_id: string
          project_id: string
          read_by_business_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "customer_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      post_message: {
        Args: { p_body: string; p_conversation: string }
        Returns: {
          author_id: string
          body: string
          conversation_id: string
          created_at: string
          id: string
          org_id: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      punch_in: {
        Args: { p_org: string }
        Returns: {
          created_at: string
          id: string
          leave_request_id: string | null
          note: string | null
          org_id: string
          punch_in_at: string | null
          punch_out_at: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
          work_date: string
        }
        SetofOptions: {
          from: "*"
          to: "attendance_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      punch_out: {
        Args: { p_org: string }
        Returns: {
          created_at: string
          id: string
          leave_request_id: string | null
          note: string | null
          org_id: string
          punch_in_at: string | null
          punch_out_at: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
          work_date: string
        }
        SetofOptions: {
          from: "*"
          to: "attendance_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      push_notification: {
        Args: {
          p_body: string
          p_dedupe?: string
          p_event: string
          p_href: string
          p_org: string
          p_user: string
        }
        Returns: undefined
      }
      push_user_notification: {
        Args: {
          p_body: string
          p_dedupe?: string
          p_event: string
          p_href?: string
          p_org: string
          p_task?: string
          p_user: string
        }
        Returns: string
      }
      recompute_project_progress: {
        Args: { p_project: string }
        Returns: number
      }
      record_customer_decision: {
        Args: { p_decision: string; p_note?: string; p_option: string }
        Returns: {
          already_decided: boolean
          decision_id: string
          option_key: string
        }[]
      }
      record_domain_event: {
        Args: {
          p_actor_kind?: string
          p_depth?: number
          p_entity_id: string
          p_entity_type: string
          p_key?: string
          p_org: string
          p_payload?: Json
          p_type: string
        }
        Returns: string
      }
      record_otp_request: {
        Args: {
          p_identifier_hash: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      request_approval: {
        Args: {
          p_approver?: string
          p_details?: string
          p_document?: string
          p_org: string
          p_project?: string
          p_task?: string
          p_title: string
        }
        Returns: {
          approver_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          details: string | null
          document_id: string | null
          id: string
          org_id: string
          project_id: string | null
          requested_by: string
          status: Database["public"]["Enums"]["approval_status"]
          task_id: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "approvals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_request_notifications: {
        Args: { p_outcome: string; p_prefix: string }
        Returns: undefined
      }
      set_org_module: {
        Args: {
          p_configuration?: Json
          p_enabled: boolean
          p_key: string
          p_org: string
          p_requires?: string[]
        }
        Returns: {
          configuration: Json
          created_at: string
          disabled_at: string | null
          enabled: boolean
          enabled_at: string | null
          enabled_by: string | null
          id: string
          module_key: string
          org_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_modules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_record_status: {
        Args: { p_note?: string; p_record: string; p_status: string }
        Returns: {
          archived_at: string | null
          assignee_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          customer_visible: boolean
          id: string
          org_id: string
          project_id: string | null
          record_type_id: string
          sort_key: number | null
          status_key: string | null
          title: string
          updated_at: string
          updated_by: string | null
          values: Json
          vendor_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      shares_org_with: { Args: { p_user: string }; Returns: boolean }
      start_direct_conversation: {
        Args: { p_org: string; p_other: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["conversation_kind"]
          last_message_at: string
          org_id: string
          title: string | null
        }
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      storage_org_id: { Args: { p_name: string }; Returns: string }
      task_transition_allowed: {
        Args: {
          p_from: Database["public"]["Enums"]["task_state"]
          p_to: Database["public"]["Enums"]["task_state"]
        }
        Returns: boolean
      }
      update_business_profile: {
        Args: {
          p_address?: string
          p_email?: string
          p_gstin?: string
          p_name: string
          p_org: string
          p_phone?: string
        }
        Returns: {
          ack_minutes: number
          address: string | null
          created_at: string
          created_by: string
          email: string | null
          gstin: string | null
          id: string
          language: string
          name: string
          phone: string | null
          quiet_end: string
          quiet_start: string
        }
        SetofOptions: {
          from: "*"
          to: "orgs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      attendance_status: "present" | "absent" | "leave" | "half_day" | "holiday"
      conversation_kind: "direct" | "group"
      day_half: "first_half" | "second_half"
      document_category:
        | "quotation"
        | "proposal"
        | "invoice"
        | "agreement"
        | "nda"
        | "purchase_order"
        | "work_order"
        | "receipt"
        | "sow"
        | "report"
        | "meeting_minutes"
        | "other"
      leave_kind: "full_day" | "half_day"
      leave_status: "pending" | "approved" | "rejected"
      member_role: "owner" | "admin" | "manager" | "member"
      project_status: "planned" | "active" | "on_hold" | "completed"
      task_priority: "low" | "normal" | "high" | "urgent"
      task_state:
        | "created"
        | "delivered"
        | "acknowledged"
        | "accepted"
        | "in_progress"
        | "done"
        | "verified"
        | "escalated"
        | "reassigned"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      approval_status: ["pending", "approved", "rejected"],
      attendance_status: ["present", "absent", "leave", "half_day", "holiday"],
      conversation_kind: ["direct", "group"],
      day_half: ["first_half", "second_half"],
      document_category: [
        "quotation",
        "proposal",
        "invoice",
        "agreement",
        "nda",
        "purchase_order",
        "work_order",
        "receipt",
        "sow",
        "report",
        "meeting_minutes",
        "other",
      ],
      leave_kind: ["full_day", "half_day"],
      leave_status: ["pending", "approved", "rejected"],
      member_role: ["owner", "admin", "manager", "member"],
      project_status: ["planned", "active", "on_hold", "completed"],
      task_priority: ["low", "normal", "high", "urgent"],
      task_state: [
        "created",
        "delivered",
        "acknowledged",
        "accepted",
        "in_progress",
        "done",
        "verified",
        "escalated",
        "reassigned",
        "cancelled",
      ],
    },
  },
} as const


// Convenience aliases the application imports. Regenerating the file above
// does not produce these, so scripts/gen-types.sh restores them.
export type TaskState = Enums<"task_state">;
export type TaskPriority = Enums<"task_priority">;
export type MemberRole = Enums<"member_role">;
