import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Create admin client with service role key for admin operations
        const supabaseAdmin = createAdminClient()
        
        // Email domain validation
        if (!req.body.email.endsWith("@vtk.be")) {
            return res.status(403).json({ error: "Email should end with @vtk.be" })
        }

        // Create the user with admin privileges
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: req.body.email,
            password: req.body.password,
            email_confirm: true, // Auto-confirm the email
            user_metadata: {
                full_name: req.body.name,
            }
        })
        
        if (userError) {
            return res.status(500).json({ error: userError.message })
        }
        
        // Create the profile record
        if (userData.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: userData.user.id,
                    name: req.body.name,
                    post: req.body.post,
                    iban: req.body.iban,
                })

            if (profileError) {
                console.error("Profile creation error:", profileError)
                return res.status(500).json({ error: profileError.message })
            }
        }

        return res.status(200).json({ message: "User created" })
    } catch (error) {
        console.error("Registration error:", error)
        return res.status(500).json({ error: "Unexpected server error" })
    }
}

