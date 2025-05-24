import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if user is admin and get the current user
    const { authorized, user: currentUser } = await requireAdmin(req, res);
    if (!authorized || !currentUser) return;

    try {
        const supabase = createAdminClient();
        const { id, isAdmin } = req.body;

        if (!id) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Prevent users from revoking their own admin rights
        if (id === currentUser.id && !isAdmin) {
            return res.status(403).json({
                error: "You cannot revoke your own admin privileges"
            });
        }

        // Update the user's admin status
        const { error, data } = await supabase
            .from('profiles')
            .update({ admin: isAdmin })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Toggle admin error:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({
            message: `Admin privileges ${isAdmin ? 'granted' : 'revoked'} successfully`,
            data
        });
    } catch (error) {
        console.error("Toggle admin error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}