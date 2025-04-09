import BillList from '../components/BillList'
import { IBill } from '../types'
import { useUser } from '../contexts/SupabaseContext'
import React from 'react'
import { createAdminClient } from '../lib/supabase'

interface IAdminInput {
    billList: [IBill]
}

export default function Admin({ billList }: IAdminInput) {
    const user = useUser();

    if (!user?.admin) {
        return <p>Access Denied</p>
    }
    return (
        <BillList billList={billList} />
    )
}

export async function getServerSideProps() {
    try {
        const supabase = createAdminClient()

        const { data: billList, error } = await supabase
            .from('bills')
            .select()
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching bills:", error)
            return { props: { billList: [] } }
        }

        return {
            props: { billList }
        }
    } catch (error) {
        console.error("Admin page error:", error)
        return { props: { billList: [] } }
    }
}