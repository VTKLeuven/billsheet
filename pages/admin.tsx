import { useUser } from '../contexts/SupabaseContext';
import BillList from '../components/BillList';

export default function Admin() {
    const user = useUser();

    // Admin access check
    if (!user?.admin) {
        return <p className="p-8 text-xl text-center">Access Denied</p>;
    }

    return <BillList adminMode={true} />;
}