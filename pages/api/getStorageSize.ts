import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 1. Security: Check if user is admin
    const { authorized } = await requireAdmin(req, res);
    if (!authorized) return;

    try {
        const supabase = createAdminClient();

        // 2. Call the SQL function we created earlier
        const { data, error } = await supabase.rpc('get_total_storage_size');

        if (error) {
            console.error("Error fetching storage:", error);
            return res.status(500).json({ error: error.message });
        }

        // Return the raw size in bytes
        return res.status(200).json({ size_bytes: data });

    } catch (error) {
        console.error("Storage check error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}