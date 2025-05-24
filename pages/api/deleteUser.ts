import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if user is admin and get the current user
    const { authorized, user: currentUser } = await requireAdmin(req, res);
    if (!authorized || !currentUser) return;

    try {
        const supabase = createAdminClient();
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Prevent self-deletion
        if (id === currentUser.id) {
            return res.status(403).json({ error: "You cannot delete your own account" });
        }

        // Check if user has any bills
        const { data: bills, error: billsError } = await supabase
            .from('bills')
            .select('id')
            .eq('user_id', id);

        if (billsError) {
            console.error("Error checking for user bills:", billsError);
            return res.status(500).json({ error: billsError.message });
        }

        // Don't delete if user has bills
        if (bills && bills.length > 0) {
            return res.status(400).json({
                error: "Cannot delete user with existing bills. Delete all user bills first."
            });
        }

        // First delete from profiles table
        const { error: profileDeleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileDeleteError) {
            console.error("Delete profile error:", profileDeleteError);
            return res.status(500).json({ error: profileDeleteError.message });
        }

        // Then delete from auth.users table
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
            id as string
        );

        if (authDeleteError) {
            console.error("Delete auth user error:", authDeleteError);
            // Try to rollback the profile deletion if auth deletion fails
            try {
                await supabase.from('profiles').update({ deleted_at: null }).eq('id', id);
            } catch (rollbackError) {
                console.error("Failed to rollback profile deletion:", rollbackError);
            }
            return res.status(500).json({
                error: `Failed to delete user from authentication system: ${authDeleteError.message}`
            });
        }

        return res.status(200).json({ message: "User completely deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}