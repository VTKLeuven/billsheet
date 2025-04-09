import { NextApiRequest, NextApiResponse } from 'next'
import { createBrowserClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Use the browser client as this is just a ping
        const supabase = createBrowserClient()
        
        await supabase.from("bills").select("count")
        res.status(200).json({ message: "Pinged Supabase" })
    } catch (error) {
        console.error("Ping error:", error)
        res.status(500).json({ error: "Failed to ping Supabase" })
    }
}

