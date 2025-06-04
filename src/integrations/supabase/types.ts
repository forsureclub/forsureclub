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
      club_users: {
        Row: {
          club_id: string | null
          created_at: string | null
          email: string
          id: string
          password_hash: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_users_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          about_club: string | null
          about_courts: string | null
          amenities: string[] | null
          coaching_available: boolean | null
          contact_email: string | null
          created_at: string | null
          description: string | null
          facilities: string[] | null
          founding_story: string | null
          id: string
          images: string[] | null
          location: string
          membership_options: string[] | null
          name: string
          operating_hours: string | null
          phone: string | null
          price_per_hour: number
          rating: number | null
          slug: string | null
          social_media: Json | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          about_club?: string | null
          about_courts?: string | null
          amenities?: string[] | null
          coaching_available?: boolean | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          facilities?: string[] | null
          founding_story?: string | null
          id?: string
          images?: string[] | null
          location: string
          membership_options?: string[] | null
          name: string
          operating_hours?: string | null
          phone?: string | null
          price_per_hour?: number
          rating?: number | null
          slug?: string | null
          social_media?: Json | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          about_club?: string | null
          about_courts?: string | null
          amenities?: string[] | null
          coaching_available?: boolean | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          facilities?: string[] | null
          founding_story?: string | null
          id?: string
          images?: string[] | null
          location?: string
          membership_options?: string[] | null
          name?: string
          operating_hours?: string | null
          phone?: string | null
          price_per_hour?: number
          rating?: number | null
          slug?: string | null
          social_media?: Json | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      court_bookings: {
        Row: {
          booking_date: string
          club_id: string | null
          court_id: string | null
          created_at: string | null
          end_time: string
          id: string
          player_email: string | null
          player_name: string | null
          player_phone: string | null
          start_time: string
          status: string | null
          stripe_session_id: string | null
          total_price: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_date: string
          club_id?: string | null
          court_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          player_email?: string | null
          player_name?: string | null
          player_phone?: string | null
          start_time: string
          status?: string | null
          stripe_session_id?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          club_id?: string | null
          court_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          player_email?: string | null
          player_name?: string | null
          player_phone?: string | null
          start_time?: string
          status?: string | null
          stripe_session_id?: string | null
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_bookings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_bookings_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          available: boolean | null
          club_id: string | null
          created_at: string | null
          hourly_rate: number | null
          id: string
          name: string
          sport: string
          surface: string | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          club_id?: string | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          sport: string
          surface?: string | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          club_id?: string | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          sport?: string
          surface?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      league_players: {
        Row: {
          created_at: string | null
          id: string
          league_id: string
          matches_lost: number
          matches_played: number
          matches_won: number
          player_id: string
          points: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          league_id: string
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          player_id: string
          points?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          league_id?: string
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          player_id?: string
          points?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "league_players_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "mini_leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_players: {
        Row: {
          created_at: string | null
          etiquette_rating: number | null
          feedback: string | null
          has_confirmed: boolean | null
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
          has_confirmed?: boolean | null
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
          has_confirmed?: boolean | null
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
          booking_details: Json | null
          booking_id: string | null
          created_at: string | null
          id: string
          league_id: string | null
          location: string
          played_at: string
          round_number: number | null
          sport: string
          status: string | null
        }
        Insert: {
          booking_details?: Json | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          league_id?: string | null
          location: string
          played_at: string
          round_number?: number | null
          sport: string
          status?: string | null
        }
        Update: {
          booking_details?: Json | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          league_id?: string | null
          location?: string
          played_at?: string
          round_number?: number | null
          sport?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "mini_leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_leagues: {
        Row: {
          created_at: string | null
          id: string
          location: string
          name: string
          player_count: number
          sport: string
          start_date: string
          status: string
          updated_at: string | null
          weeks_between_matches: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          location: string
          name: string
          player_count?: number
          sport: string
          start_date: string
          status?: string
          updated_at?: string | null
          weeks_between_matches?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string
          name?: string
          player_count?: number
          sport?: string
          start_date?: string
          status?: string
          updated_at?: string | null
          weeks_between_matches?: number
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
      player_contacts: {
        Row: {
          booking_id: string | null
          club_id: string | null
          created_at: string | null
          email: string
          id: string
          notes: string | null
          phone: string | null
          player_name: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          club_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          notes?: string | null
          phone?: string | null
          player_name: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          club_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          player_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_contacts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "court_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_contacts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
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
      player_videos: {
        Row: {
          ai_feedback: string | null
          created_at: string
          id: string
          player_id: string
          sport: string
          updated_at: string
          video_url: string
        }
        Insert: {
          ai_feedback?: string | null
          created_at?: string
          id?: string
          player_id: string
          sport: string
          updated_at?: string
          video_url: string
        }
        Update: {
          ai_feedback?: string | null
          created_at?: string
          id?: string
          player_id?: string
          sport?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          budget_range: string
          city: string
          club: string | null
          created_at: string | null
          elo_rating: number | null
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
          elo_rating?: number | null
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
          elo_rating?: number | null
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
      table_name: {
        Row: {
          data: Json | null
          id: number
          inserted_at: string
          name: string | null
          updated_at: string
        }
        Insert: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          bracket_data: Json | null
          created_at: string | null
          description: string | null
          end_date: string | null
          format: string
          id: string
          location: string
          max_rating: number | null
          min_rating: number | null
          name: string
          sport: string
          start_date: string
          status: string | null
        }
        Insert: {
          bracket_data?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          format: string
          id?: string
          location: string
          max_rating?: number | null
          min_rating?: number | null
          name: string
          sport: string
          start_date: string
          status?: string | null
        }
        Update: {
          bracket_data?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          format?: string
          id?: string
          location?: string
          max_rating?: number | null
          min_rating?: number | null
          name?: string
          sport?: string
          start_date?: string
          status?: string | null
        }
        Relationships: []
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
