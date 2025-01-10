import { useRouter } from "next/router"
import { supabase } from "../lib/supabaseClient";
import { notifications } from "@mantine/notifications";
import { useUser } from "../contexts/UserContext";

export default function NavBar() {
    const router = useRouter();
    const { user } = useUser();
    let links = new Map();
    links.set("Home", "/");
    links.set("Profile", "/account");

    if (user?.admin) {
        links.set("Bills", "/admin");
        links.set("Users", "/users");
    } else {
        links.delete("Bills")
        links.delete("Users")
    }

    async function logOut() {
        const { error } = await supabase.auth.signOut()
        notifications.show({
            title: "Logged out",
            message: "You have been logged out"
        })
        router.push("/");
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
            {user ? <button className="float-right" onClick={() => logOut()}>
                <div className="p-4 text-xl font-bold b-x-2 border-slate-600">
                    Logout
                </div>
            </button> : <></>}
        </div>
    )
}
