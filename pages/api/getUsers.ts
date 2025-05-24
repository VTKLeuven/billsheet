import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if user is admin
    const { authorized } = await requireAdmin(req, res);
    if (!authorized) return;

    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("admin", { ascending: false })
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ users: data });
    } catch (error) {
        console.error("Get users error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}