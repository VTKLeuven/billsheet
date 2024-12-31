import BillList from '../components/BillList'
import { supabase } from '../lib/supabaseClient'
import { IBill } from '../types'
import { useUser } from '../contexts/UserContext'
import React from 'react'

interface IAdminInput {
    billList: [IBill]
}

export default function Admin({ billList }: IAdminInput) {
    const { user } = useUser();

    if (!user?.admin) {
        return <p>Access Denied</p>
    }
    return (
        <BillList billList={billList} />
    )
}

export async function getServerSideProps(context: any) {
    const { data: billList, error } = await supabase
        .from('bills')
        .select()
        .order('created_at', { ascending: false })
    return {
        props: { billList }
    }
}