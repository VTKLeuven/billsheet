import { useUser } from "@supabase/auth-helpers-react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react";
import getUserData from "../lib/getUser";

export default function NavBar() {
    const router = useRouter();
    const user = useUser();
    const [admin, setAdmin] = useState(false);
    let links = new Map();
    links.set("Home", "/");
    links.set("Profile", "/account");

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

    if (admin) {
        links.set("Admin", "/admin");
    }

    return (
        <div className="b-4 bg-slate-100 border-vtk-yellow min-height-5%">
            {Array.from(links).map(([k, v]) =>
                <button key={k} onClick={() => router.push(v)}>
                    <div className="p-4 text-xl font-bold b-x-2 border-slate-600">
                        {k}
                    </div>
                </button>
            )}
        </div>
    )
}
