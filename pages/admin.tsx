import { useEffect, useState } from 'react'
import BillList from '../components/BillList'
import getUserData from '../lib/getUser'
import { supabase } from '../lib/supabaseClient'
import { IBill, Profile } from '../types'
import { useUser } from '@supabase/auth-helpers-react'

interface IAdminInput {
    billList: [IBill]
}

export default function Admin({ billList }: IAdminInput) {
    const user = useUser();
    const [userData, setUserData] = useState<Profile>();

    useEffect(() => {
        const getUser = async () => {
            if (user) {
                const userData = await getUserData(user.id)
                setUserData(userData)
            }
        }
        if (user) {
            getUser()
        }
    }, [user]);

    if (userData == undefined) {
        return <></>
    }

    if (!userData?.admin) {
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