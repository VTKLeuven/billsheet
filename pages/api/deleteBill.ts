import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if user is admin
    const { authorized } = await requireAdmin(req, res);
    if (!authorized) return;

    try {
        const supabase = createAdminClient();
        const billId = req.query.id as string;

        if (!billId) {
            return res.status(400).json({ error: "Bill ID is required" });
        }

        // First get the bill to retrieve the image filename
        const { data: bill, error: fetchError } = await supabase
            .from('bills')
            .select('image')
            .eq('id', billId)
            .single();

        if (fetchError) {
            console.error("Fetch bill error:", fetchError);
            return res.status(404).json({ error: "Bill not found" });
        }

        // Delete the bill image from storage
        if (bill?.image) {
            const { error: storageError } = await supabase.storage
                .from('bill_images')
                .remove([bill.image]);

            if (storageError) {
                console.error("Image deletion error:", storageError);
                // Continue with bill deletion even if image deletion fails
            }
        }

        // Delete the bill from the database
        const { error: deleteError } = await supabase
            .from('bills')
            .delete()
            .eq('id', billId);

        if (deleteError) {
            console.error("Delete bill error:", deleteError);
            return res.status(500).json({ error: deleteError.message });
        }

        return res.status(200).json({ message: "Bill deleted successfully" });
    } catch (error) {
        console.error("Delete bill error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}