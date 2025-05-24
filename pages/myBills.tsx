import { Loader } from "@mantine/core";
import { useSession } from '../contexts/SupabaseContext';
import { useRouter } from 'next/router';
import BillList from '../components/BillList';

export default function MyBills() {
    const session = useSession();
    const router = useRouter();

    // Redirect to home if not logged in
    if (session === null) {
        typeof window !== 'undefined' && router.push('/');
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    return <BillList adminMode={false} />;
}
