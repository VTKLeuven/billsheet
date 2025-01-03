import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseClient";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { error } = await supabase
        .from('bills')
        .update({ paid: req.body.paid })
        .eq('id', req.body.id)

    if (error) {
        res.status(500).json({ error: error.message })
        return;
    } else {
        res.status(200).json({ message: "OK" })
    }
}
