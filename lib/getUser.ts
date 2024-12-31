import { supabase } from "./supabaseClient";

export default async function getUserData(userid: string) {
    const { data, error, status } = await supabase
        .from("profiles")
        .select()
        .eq("id", userid)
        .single();
    if (error && status !== 406) throw error;
    if (data) {
        return data
    }
}