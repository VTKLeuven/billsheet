import { useEffect, useState } from 'react'
import BillList from '../components/BillList'
import getUserData from '../lib/getUser'
import { supabase } from '../lib/supabaseClient'
import { IBill } from '../types'
import { useUser } from '@supabase/auth-helpers-react'

interface IAdminInput {
    billList: [IBill]
}

export default function Admin({ billList }: IAdminInput) {
    const user = useUser();
    const [admin, setAdmin] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            if (user) {
                const userData = await getUserData(user.id)
                setAdmin(userData?.admin ?? false)
            }
        }
        if (user) {
            getUser()
        }
    }, [user]);

    if(!admin) {
        return <p>Access Denied</p>
    }
    return (
        <BillList billList={billList} />
    )
}

export async function getServerSideProps(context: any) {
    console.log("context:-------------------------------------------------------------------------------------------------------")
    console.log(context.req)
    // const isAdmin = (await getUserData(context.session.user.id))?.admin
    // if(!isAdmin) {
    //     return {
    //         redirect: {
    //             permanent: false,
    //             destination: "/"
    //         }
    //     }
    // }
    const { data: billList, error } = await supabase
        .from('bills')
        .select()
        .order('created_at', { ascending: false })
    return {
        props: { billList }
    }
}