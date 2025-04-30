import { useRouter } from "next/router";
import { useUser, useSupabaseClient } from "../contexts/SupabaseContext";
import { notifications } from "@mantine/notifications";
import Link from "next/link";

export default function NavBar() {
    const router = useRouter();
    const user = useUser();
    const supabase = useSupabaseClient();
    
    let regularLinks = new Map();
    regularLinks.set("Home", "/");
    
    if (user) {
        regularLinks.set("My Bills", "/myBills");
        regularLinks.set("Profile", "/account");
    }

    let adminLinks = new Map();
    if (user?.admin) {
        adminLinks.set("All Bills", "/admin");
        adminLinks.set("Users", "/users");
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
        <nav className="b-4 bg-slate-100 border-vtk-yellow min-height-5% flex items-center">
            {/* Regular links */}
            {Array.from(regularLinks).map(([k, v]) =>
                <Link key={k} href={v}>
                    <div className="p-4 text-xl font-bold b-x-2 border-slate-600">
                        {k}
                    </div>
                </Link>
            )}
            
            {/* Admin section with subtle divider */}
            {user?.admin && (
                <>
                    <div className="h-8 border-l-2 border-slate-600 mx-2"></div>
                    {Array.from(adminLinks).map(([k, v]) =>
                        <Link key={k} href={v}>
                            <div className="p-4 text-xl font-bold b-x-2 border-slate-600">
                                {k}
                            </div>
                        </Link>
                    )}
                </>
            )}
            
            {/* Logout button */}
            {user ?
                <button className="ml-auto" onClick={() => logOut()}>
                    <div className="p-4 text-xl font-bold b-x-2 border-slate-600">
                        Logout
                    </div>
                </button> : <></>}
        </nav>
    );
}
