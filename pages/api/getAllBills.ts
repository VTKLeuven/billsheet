import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check if user is admin
    const { authorized } = await requireAdmin(req, res);
    if (!authorized) return;

    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching bills:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ bills: data });
    } catch (error) {
        console.error("Get all bills error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}