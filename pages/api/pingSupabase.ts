import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await supabase.from("bills").select()
    res.status(200).json({ message: "Pinged Supabase" })
}

