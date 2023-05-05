import BillList from '../components/BillList'
import { supabase } from '../lib/supabaseClient'
import { IBill } from '../types'

interface IAdminInput {
    billList: [IBill]
}

export default function Admin({ billList }: IAdminInput) { 
    return (
        <BillList billList={billList}/>
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