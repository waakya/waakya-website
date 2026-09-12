// Generated from the live schema with the Supabase types generator.
// Regenerate after every migration; never hand-edit to match code.
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          dedupe_key: string | null
          event: string
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
      orgs: {
        Row: {
          ack_minutes: number
          created_at: string
          created_by: string
          id: string
          language: string
          name: string
          quiet_end: string
          quiet_start: string
        }
        Insert: {
          ack_minutes?: number
          created_at?: string
          created_by: string
          id?: string
          language?: string
          name: string
          quiet_end?: string
          quiet_start?: string
        }
        Update: {
          ack_minutes?: number
          created_at?: string
          created_by?: string
          id?: string
          language?: string
          name?: string
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
      proofs: {
        Row: {
          body: string | null
          created_at: string
          created_by: string
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
          cancelled_at: string | null
          checklist_date: string | null
          checklist_item_id: string | null
          created_at: string
          created_by: string
          delivered_at: string | null
          details: string | null
          done_at: string | null
          due_at: string | null
          id: string
          org_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          proof_required: boolean
          started_at: string | null
          state: Database["public"]["Enums"]["task_state"]
          title: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          ack_minutes?: number | null
          acknowledged_at?: string | null
          assigned_to?: string | null
          cancelled_at?: string | null
          checklist_date?: string | null
          checklist_item_id?: string | null
          created_at?: string
          created_by: string
          delivered_at?: string | null
          details?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          priority?: Database["public"]["Enums"]["task_priority"]
          proof_required?: boolean
          started_at?: string | null
          state?: Database["public"]["Enums"]["task_state"]
          title: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          ack_minutes?: number | null
          acknowledged_at?: string | null
          assigned_to?: string | null
          cancelled_at?: string | null
          checklist_date?: string | null
          checklist_item_id?: string | null
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          details?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          proof_required?: boolean
          started_at?: string | null
          state?: Database["public"]["Enums"]["task_state"]
          title?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
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
      invite_preview: {
        Args: { p_token: string }
        Returns: {
          already_accepted: boolean
          full_name: string
          org_language: string
          org_name: string
        }[]
      }
      is_org_admin: { Args: { p_org: string }; Returns: boolean }
      is_org_member: { Args: { p_org: string }; Returns: boolean }
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
      org_member_email: { Args: { p_user: string }; Returns: string }
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
      record_otp_request: {
        Args: {
          p_identifier_hash: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      shares_org_with: { Args: { p_user: string }; Returns: boolean }
      storage_org_id: { Args: { p_name: string }; Returns: string }
    }
    Enums: {
      attendance_status: "present" | "absent" | "leave" | "half_day" | "holiday"
      day_half: "first_half" | "second_half"
      leave_kind: "full_day" | "half_day"
      leave_status: "pending" | "approved" | "rejected"
      member_role: "owner" | "admin" | "manager" | "member"
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
  public: {
    Enums: {
      attendance_status: ["present", "absent", "leave", "half_day", "holiday"],
      day_half: ["first_half", "second_half"],
      leave_kind: ["full_day", "half_day"],
      leave_status: ["pending", "approved", "rejected"],
      member_role: ["owner", "admin", "manager", "member"],
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
// does not produce these, so they are restored here after every regeneration.
export type TaskState = Enums<"task_state">;
export type TaskPriority = Enums<"task_priority">;
export type MemberRole = Enums<"member_role">;
export type AttendanceStatusEnum = Enums<"attendance_status">;
export type LeaveStatusEnum = Enums<"leave_status">;
export type LeaveKindEnum = Enums<"leave_kind">;
