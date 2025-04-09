import { useRouter } from "next/router";
import { useUser, useSupabaseClient, useAuthLoading } from "../contexts/SupabaseContext";
import { notifications } from "@mantine/notifications";
import Link from "next/link";

export default function NavBar() {
    const router = useRouter();
    const user = useUser();
    const supabase = useSupabaseClient();
    
    let links = new Map();
    links.set("Home", "/");
    links.set("Profile", "/account");

    if (user?.admin) {
        links.set("Bills", "/admin");
        links.set("Users", "/users");
    } else {
        links.delete("Bills");
        links.delete("Users");
    }

    async function logOut() {
        const { error } = await supabase.auth.signOut();
        notifications.show({
            title: "Logged out",
            message: "You have been logged out",
        });
        router.push("/");
    }

    return (
        <nav className="b-4 bg-slate-100 border-vtk-yellow min-height-5% flex">
            {Array.from(links).map(([k, v]) =>
                <Link key={k} href={v}>
                    <div className="p-4 text-xl font-bold b-x-2 border-slate-600">
                        {k}
                    </div>
                </Link>
            )}
            {user ?
                <button className="ml-auto" onClick={() => logOut()}>
                    <div className="p-4 text-xl font-bold b-x-2 border-slate-600">
                        Logout
                    </div>
                </button> : <></>}
        </nav>
    );
}
