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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      news_archive: {
        Row: {
          author: string | null
          id: string
          url: string
          title: string
          description: string
          source: string
          published_at: string
          category: string
          collection: string
          sentiment: number | null
          severity: number | null
          location_name: string | null
          location_country: string | null
          latitude: number | null
          longitude: number | null
          analysis_method: string | null
          analysis_confidence: number | null
          analysis_rationale: string | null
          first_seen_at: string
          last_seen_at: string
        }
        Insert: {
          author?: string | null
          id: string
          url: string
          title: string
          description?: string
          source: string
          published_at: string
          category: string
          collection?: string
          sentiment?: number | null
          severity?: number | null
          location_name?: string | null
          location_country?: string | null
          latitude?: number | null
          longitude?: number | null
          analysis_method?: string | null
          analysis_confidence?: number | null
          analysis_rationale?: string | null
          first_seen_at?: string
          last_seen_at?: string
        }
        Update: {
          author?: string | null
          id?: string
          url?: string
          title?: string
          description?: string
          source?: string
          published_at?: string
          category?: string
          collection?: string
          sentiment?: number | null
          severity?: number | null
          location_name?: string | null
          location_country?: string | null
          latitude?: number | null
          longitude?: number | null
          analysis_method?: string | null
          analysis_confidence?: number | null
          analysis_rationale?: string | null
          first_seen_at?: string
          last_seen_at?: string
        }
        Relationships: []
      }
      news_analysis_budget: {
        Row: {
          budget_day: string
          id: string
          last_updated_at: string | null
          next_at: string
          paused_reason: string | null
          used: number
        }
        Insert: {
          budget_day?: string
          id: string
          last_updated_at?: string | null
          next_at?: string
          paused_reason?: string | null
          used?: number
        }
        Update: {
          budget_day?: string
          id?: string
          last_updated_at?: string | null
          next_at?: string
          paused_reason?: string | null
          used?: number
        }
        Relationships: []
      }
      news_analysis_cache: {
        Row: {
          analysis: Json
          analyzed_at: string
          article_id: string
          content_hash: string
        }
        Insert: {
          analysis: Json
          analyzed_at?: string
          article_id: string
          content_hash: string
        }
        Update: {
          analysis?: Json
          analyzed_at?: string
          article_id?: string
          content_hash?: string
        }
        Relationships: []
      }
      publisher_news_cache: {
        Row: {
          id: string
          last_error: string | null
          next_refresh_at: string
          snapshot: Json | null
        }
        Insert: {
          id?: string
          last_error?: string | null
          next_refresh_at?: string
          snapshot?: Json | null
        }
        Update: {
          id?: string
          last_error?: string | null
          next_refresh_at?: string
          snapshot?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_news_analysis_batch: {
        Args: { batch_count: number }
        Returns: string
      }
      claim_publisher_news_refresh: { Args: never; Returns: boolean }
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
    Enums: {},
  },
} as const
