import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('bills')
            .update({ paid: req.body.paid })
            .eq('id', req.body.id)

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ message: "OK" })
    } catch (error) {
        console.error("Set paid error:", error)
        return res.status(500).json({ error: "Unexpected server error" })
    }
}
