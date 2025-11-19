import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Check if user is admin
    const { authorized } = await requireAdmin(req, res);
    if (!authorized) return;

    const { id, booked } = req.body;
    if (!id || booked === undefined) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('bills')
            .update({ booked })
            .eq('id', id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: "OK" });
    } catch (error) {
        console.error("Set booked error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}
