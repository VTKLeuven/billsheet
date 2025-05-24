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

        const {
            id,
            name,
            post,
            date,
            activity,
            desc,
            amount,
            payment_method,
            iban
        } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Bill ID is required" });
        }

        // First, check if the bill is already paid
        const { data: existingBill, error: fetchError } = await supabase
            .from('bills')
            .select('paid')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error("Fetch bill error:", fetchError);
            return res.status(500).json({ error: fetchError.message });
        }

        // If the bill is already paid, don't allow updates
        if (existingBill && existingBill.paid) {
            return res.status(403).json({ error: "Paid bills cannot be edited" });
        }

        // If not paid, proceed with the update
        const { error, data } = await supabase
            .from('bills')
            .update({
                name,
                post,
                date,
                activity,
                desc,
                amount,
                payment_method,
                iban,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Update bill error:", error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: "OK", data });
    } catch (error) {
        console.error("Update bill error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}