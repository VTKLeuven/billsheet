import { Database } from "./supabase"
// export interface IBill {
//     id: number,
//     name: string,
//     post: string,
//     activity: string,
//     desc: string,
//     data: string,
//     payment_method: string,
//     iban: string,
//     image: string
// }

export type IBill = Database['public']['Tables']['bills']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']