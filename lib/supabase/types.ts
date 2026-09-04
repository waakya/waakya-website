// Generated from the live schema with the Supabase types generator.
// Regenerate after every migration; never hand-edit to match code.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      checklist_items: {
        Row: {
          checklist_id: string;
          created_at: string;
          id: string;
          org_id: string;
          position: number;
          proof_required: boolean;
          title: string;
        };
        Insert: {
          checklist_id: string;
          created_at?: string;
          id?: string;
          org_id: string;
          position?: number;
          proof_required?: boolean;
          title: string;
        };
        Update: {
          checklist_id?: string;
          created_at?: string;
          id?: string;
          org_id?: string;
          position?: number;
          proof_required?: boolean;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey";
            columns: ["checklist_id"];
            isOneToOne: false;
            referencedRelation: "checklists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_items_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      checklists: {
        Row: {
          active: boolean;
          assigned_to: string | null;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          org_id: string;
          run_at: string;
          window_minutes: number;
        };
        Insert: {
          active?: boolean;
          assigned_to?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          org_id: string;
          run_at?: string;
          window_minutes?: number;
        };
        Update: {
          active?: boolean;
          assigned_to?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          org_id?: string;
          run_at?: string;
          window_minutes?: number;
        };
        Relationships: [
          {
            foreignKeyName: "checklists_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      escalations: {
        Row: {
          id: string;
          notified_user: string | null;
          org_id: string;
          reason: string;
          task_id: string;
          triggered_at: string;
        };
        Insert: {
          id?: string;
          notified_user?: string | null;
          org_id: string;
          reason: string;
          task_id: string;
          triggered_at?: string;
        };
        Update: {
          id?: string;
          notified_user?: string | null;
          org_id?: string;
          reason?: string;
          task_id?: string;
          triggered_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "escalations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "escalations_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          created_by: string;
          expires_at: string;
          full_name: string;
          id: string;
          org_id: string;
          phone: string;
          role: Database["public"]["Enums"]["member_role"];
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          created_by: string;
          expires_at?: string;
          full_name: string;
          id?: string;
          org_id: string;
          phone: string;
          role?: Database["public"]["Enums"]["member_role"];
          token: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          created_by?: string;
          expires_at?: string;
          full_name?: string;
          id?: string;
          org_id?: string;
          phone?: string;
          role?: Database["public"]["Enums"]["member_role"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invites_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          id: string;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          org_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          dedupe_key: string | null;
          event: string;
          id: string;
          org_id: string;
          read_at: string | null;
          task_id: string | null;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          event: string;
          id?: string;
          org_id: string;
          read_at?: string | null;
          task_id?: string | null;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          event?: string;
          id?: string;
          org_id?: string;
          read_at?: string | null;
          task_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      orgs: {
        Row: {
          ack_minutes: number;
          created_at: string;
          created_by: string;
          id: string;
          language: string;
          name: string;
          quiet_end: string;
          quiet_start: string;
        };
        Insert: {
          ack_minutes?: number;
          created_at?: string;
          created_by: string;
          id?: string;
          language?: string;
          name: string;
          quiet_end?: string;
          quiet_start?: string;
        };
        Update: {
          ack_minutes?: number;
          created_at?: string;
          created_by?: string;
          id?: string;
          language?: string;
          name?: string;
          quiet_end?: string;
          quiet_start?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          language: string | null;
          phone: string | null;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          language?: string | null;
          phone?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          language?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      proofs: {
        Row: {
          body: string | null;
          created_at: string;
          created_by: string;
          id: string;
          kind: string;
          org_id: string;
          task_id: string;
          url: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          kind?: string;
          org_id: string;
          task_id: string;
          url?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          kind?: string;
          org_id?: string;
          task_id?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "proofs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proofs_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          from_state: Database["public"]["Enums"]["task_state"] | null;
          id: string;
          note: string | null;
          org_id: string;
          task_id: string;
          to_state: Database["public"]["Enums"]["task_state"];
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          from_state?: Database["public"]["Enums"]["task_state"] | null;
          id?: string;
          note?: string | null;
          org_id: string;
          task_id: string;
          to_state: Database["public"]["Enums"]["task_state"];
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          from_state?: Database["public"]["Enums"]["task_state"] | null;
          id?: string;
          note?: string | null;
          org_id?: string;
          task_id?: string;
          to_state?: Database["public"]["Enums"]["task_state"];
        };
        Relationships: [
          {
            foreignKeyName: "task_events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_events_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_messages: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          org_id: string;
          task_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          org_id: string;
          task_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          org_id?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_messages_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_messages_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          accepted_at: string | null;
          ack_minutes: number | null;
          acknowledged_at: string | null;
          assigned_to: string | null;
          cancelled_at: string | null;
          checklist_date: string | null;
          checklist_item_id: string | null;
          created_at: string;
          created_by: string;
          delivered_at: string | null;
          details: string | null;
          done_at: string | null;
          due_at: string | null;
          id: string;
          org_id: string;
          priority: Database["public"]["Enums"]["task_priority"];
          proof_required: boolean;
          started_at: string | null;
          state: Database["public"]["Enums"]["task_state"];
          title: string;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          ack_minutes?: number | null;
          acknowledged_at?: string | null;
          assigned_to?: string | null;
          cancelled_at?: string | null;
          checklist_date?: string | null;
          checklist_item_id?: string | null;
          created_at?: string;
          created_by: string;
          delivered_at?: string | null;
          details?: string | null;
          done_at?: string | null;
          due_at?: string | null;
          id?: string;
          org_id: string;
          priority?: Database["public"]["Enums"]["task_priority"];
          proof_required?: boolean;
          started_at?: string | null;
          state?: Database["public"]["Enums"]["task_state"];
          title: string;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          ack_minutes?: number | null;
          acknowledged_at?: string | null;
          assigned_to?: string | null;
          cancelled_at?: string | null;
          checklist_date?: string | null;
          checklist_item_id?: string | null;
          created_at?: string;
          created_by?: string;
          delivered_at?: string | null;
          details?: string | null;
          done_at?: string | null;
          due_at?: string | null;
          id?: string;
          org_id?: string;
          priority?: Database["public"]["Enums"]["task_priority"];
          proof_required?: boolean;
          started_at?: string | null;
          state?: Database["public"]["Enums"]["task_state"];
          title?: string;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_checklist_item_id_fkey";
            columns: ["checklist_item_id"];
            isOneToOne: false;
            referencedRelation: "checklist_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_org_admin: { Args: { p_org: string }; Returns: boolean };
      is_org_member: { Args: { p_org: string }; Returns: boolean };
      accept_invite: { Args: { p_token: string }; Returns: string };
      create_org: {
        Args: { p_name: string; p_language?: string };
        Returns: string;
      };
      invite_preview: {
        Args: { p_token: string };
        Returns: {
          org_name: string;
          org_language: string;
          full_name: string;
          already_accepted: boolean;
        }[];
      };
      org_member_email: { Args: { p_user: string }; Returns: string | null };
      shares_org_with: { Args: { p_user: string }; Returns: boolean };
      record_otp_request: {
        Args: {
          p_identifier_hash: string;
          p_max_requests?: number;
          p_window_minutes?: number;
        };
        Returns: boolean;
      };
    };
    Enums: {
      member_role: "owner" | "admin" | "manager" | "member";
      task_priority: "low" | "normal" | "high" | "urgent";
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
        | "cancelled";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"];
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T];

export type TaskState = Enums<"task_state">;
export type TaskPriority = Enums<"task_priority">;
export type MemberRole = Enums<"member_role">;
