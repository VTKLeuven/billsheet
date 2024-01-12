import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!req.body.email.endsWith("@vtk.be")) {
        res.status(403).json({ error: "Email should end with @vtk.be" })
        return;
    }

    const { data: _, error: userError } = await supabase.auth.admin.createUser({
        email: req.body.email,
        password: req.body.password,
        user_metadata: {
            full_name: req.body.name,
            post: req.body.post,
            iban: req.body.iban,
        }
    })
    const { data, error } = await supabase.auth.signInWithOtp({
        email: req.body.email,
    })

    if (userError) {
        res.status(500).json({ error: userError.message })
        return;
    }

    res.status(200).json({ message: "User created" })
}

