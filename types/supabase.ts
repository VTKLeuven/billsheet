export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bills: {
        Row: {
          activity: string | null
          amount: number | null
          booked: boolean | null
          created_at: string | null
          date: string | null
          desc: string | null
          iban: string | null
          id: number
          image: string | null
          name: string | null
          paid: boolean | null
          payment_method: string | null
          post: string | null
          uid: string | null
        }
        Insert: {
          activity?: string | null
          amount?: number | null
          booked?: boolean | null
          created_at?: string | null
          date?: string | null
          desc?: string | null
          iban?: string | null
          id?: number
          image?: string | null
          name?: string | null
          paid?: boolean | null
          payment_method?: string | null
          post?: string | null
          uid?: string | null
        }
        Update: {
          activity?: string | null
          amount?: number | null
          booked?: boolean | null
          created_at?: string | null
          date?: string | null
          desc?: string | null
          iban?: string | null
          id?: number
          image?: string | null
          name?: string | null
          paid?: boolean | null
          payment_method?: string | null
          post?: string | null
          uid?: string | null
        }
      }
      profiles: {
        Row: {
          admin: boolean | null
          iban: string | null
          id: string
          name: string | null
          post: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          admin?: boolean | null
          iban?: string | null
          id: string
          name?: string | null
          post?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          admin?: boolean | null
          iban?: string | null
          id?: string
          name?: string | null
          post?: string | null
          updated_at?: string | null
          username?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
