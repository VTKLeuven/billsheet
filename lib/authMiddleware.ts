import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from './supabase';
import jwt from 'jsonwebtoken';
import type { Profile } from '../types';
import { parse } from 'cookie';

export async function getUserFromToken(token: string): Promise<Profile | null> {
    try {
        // Decode the token to get the user ID
        const decoded = jwt.decode(token) as any;
        if (!decoded || !decoded.sub) return null;

        const userId = decoded.sub;
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error in getUserFromToken:', error);
        return null;
    }
}

export async function requireAuth(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<{ user: Profile | null; authorized: boolean }> {
    let token: string | undefined = undefined;
    // If no token in header, try to get from cookies
    if (req.headers.cookie) {
        const cookies = parse(req.headers.cookie);
        token = cookies['supabase-auth-token'];
    }
    
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return { user: null, authorized: false };
    }

    // Get the user data
    const user = await getUserFromToken(token);
    if (!user) {
        res.status(401).json({ error: 'User not found' });
        return { user: null, authorized: false };
    }

    return { user, authorized: true };
}

export async function requireAdmin(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<{ user: Profile | null; authorized: boolean }> {
    const { user, authorized } = await requireAuth(req, res);

    if (!authorized) return { user: null, authorized: false };

    if (!user?.admin) {
        res.status(403).json({ error: 'Access denied' });
        return { user, authorized: false };
    }

    return { user, authorized: true };
}