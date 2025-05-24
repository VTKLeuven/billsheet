import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabase = createAdminClient()

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