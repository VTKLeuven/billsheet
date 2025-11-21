import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if user is admin
    const { authorized } = await requireAdmin(req, res);
    if (!authorized) return;

    try {
        const supabase = createAdminClient();

        const { id, name, post, iban } = req.body;

        if (!id) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Update the user profile
        const { error, data } = await supabase
            .from('profiles')
            .update({ name, post, iban, allowed_posts: req.body.allowed_posts })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Update user error:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: "OK", data });
    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}