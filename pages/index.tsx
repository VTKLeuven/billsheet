import {
    useSession,
} from "@supabase/auth-helpers-react";
import AuthUI from "../components/Auth";
import Form from "../components/Form";

export default function Home() {
    const session = useSession();

    return (
        <div className="flex min-w-full min-h-full object-fill justify-center align-center m-10">
            {session ? <Form/> : <AuthUI /> }
        </div>
    );
}
