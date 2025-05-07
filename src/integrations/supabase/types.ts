export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auth_profiles: {
        Row: {
          created_at: string
          id: string
          player_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          player_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_ai: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_ai?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_ai?: boolean
          user_id?: string
        }
        Relationships: []
      }
      match_players: {
        Row: {
          created_at: string | null
          etiquette_rating: number | null
          feedback: string | null
          id: string
          match_id: string | null
          performance_rating: number | null
          play_rating: number | null
          player_id: string | null
          reliability_rating: number | null
          review_comment: string | null
        }
        Insert: {
          created_at?: string | null
          etiquette_rating?: number | null
          feedback?: string | null
          id?: string
          match_id?: string | null
          performance_rating?: number | null
          play_rating?: number | null
          player_id?: string | null
          reliability_rating?: number | null
          review_comment?: string | null
        }
        Update: {
          created_at?: string | null
          etiquette_rating?: number | null
          feedback?: string | null
          id?: string
          match_id?: string | null
          performance_rating?: number | null
          play_rating?: number | null
          player_id?: string | null
          reliability_rating?: number | null
          review_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          location: string
          played_at: string
          sport: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location: string
          played_at: string
          sport: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string
          played_at?: string
          sport?: string
          status?: string | null
        }
        Relationships: []
      }
      "New Players": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      player_registrations: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          player_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          budget_range: string
          city: string
          club: string | null
          created_at: string | null
          email: string | null
          gender: string
          id: string
          name: string
          occupation: string
          phone_number: string | null
          play_time: string
          rating: number
          sport: string
          user_id: string | null
        }
        Insert: {
          budget_range: string
          city: string
          club?: string | null
          created_at?: string | null
          email?: string | null
          gender: string
          id?: string
          name: string
          occupation: string
          phone_number?: string | null
          play_time: string
          rating: number
          sport: string
          user_id?: string | null
        }
        Update: {
          budget_range?: string
          city?: string
          club?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string
          id?: string
          name?: string
          occupation?: string
          phone_number?: string | null
          play_time?: string
          rating?: number
          sport?: string
          user_id?: string | null
        }
        Relationships: []
      }
      skill_assessments: {
        Row: {
          assessment_type: string
          created_at: string
          experience_level: string | null
          id: string
          notes: string | null
          player_id: string
          self_rating: number
        }
        Insert: {
          assessment_type: string
          created_at?: string
          experience_level?: string | null
          id?: string
          notes?: string | null
          player_id: string
          self_rating: number
        }
        Update: {
          assessment_type?: string
          created_at?: string
          experience_level?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          self_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
