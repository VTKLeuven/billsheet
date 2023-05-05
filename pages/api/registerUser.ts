import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'


export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!req.body.email.endsWith("@vtk.be")) {
        throw new Error("Must be a vtk email")
    }

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: req.body.email[0],
        password: req.body.password[0]
    })

    if (userError) throw new Error("Something went wrong")
    res.redirect("/")
}

