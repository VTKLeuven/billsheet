import { useRouter } from "next/router"

export default function NavBar() {
    const links = {
        "Home": "/",
        "Profile": "/account",
        "Admin": "/admin"
    }

    const router = useRouter()

    return (
        <div className="b-4 bg-slate-100 border-vtk-yellow min-height-5%">
            {Object.entries(links).map(([k,v]) => 
                <button key={k} onClick={() => router.push(v)}>
                    <div className="p-4 text-xl font-bold b-x-2 border-slate-600">
                        {k}
                    </div>
                </button>
            )}
            
        </div>
    )
}
