import { useState } from "react";

export default function RegistrationForm() {
    const posts = [
        "Activiteiten",
        "Bedrijvenrelaties",
        "Communicatie",
        "Cultuur",
        "Cursusdienst",
        "Development",
        "Fakbar",
        "G5",
        "Internationaal",
        "IT",
        "Logistiek",
        "Onderwijs",
        "Sport",
        "Theokot",
    ];
    return (
        <form className="flex content-center justify-content flex-col" action="/api/registerUser" method="post" encType="multipart/form-data">
            <table className="border-spacing">
                <tbody>
                    <tr>
                        <td className="py-2">
                            <label htmlFor="name" className="p-3">
                                Naam
                            </label>
                        </td>
                        <td className="py-2 pl-10">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="border-b-2 border-slate-300"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="py-2">
                            <label htmlFor="email" className="p-3">
                                Email
                            </label>
                        </td>
                        <td className="py-2 pl-10">
                            <input
                                id="email"
                                name="email"
                                type="text"
                                required
                                className="border-b-2 border-slate-300"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="py-2">
                            <label htmlFor="post" className="p-3">
                                Post
                            </label>
                        </td>
                        <td className="py-2 pl-10">
                            <select
                                id="post"
                                name="post"
                                required
                                className="border-b-2 border-slate-300 background-white"
                            >
                                {posts.map((postOption: string) => (
                                    <option key={postOption} value={postOption}>
                                        {postOption}
                                    </option>
                                ))}
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className="py-2">
                            <label htmlFor="iban" className="p-3">
                                Rekeningnummer
                            </label>
                        </td>
                        <td className="py-2 pl-10">
                            <input
                                id="iban"
                                name="iban"
                                type="text"
                                required
                                className="border-b-2 border-slate-300"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="py-2">
                            <label htmlFor="password" className="p-3">
                                Wachtwoord
                            </label>
                        </td>
                        <td className="py-2 pl-10">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="border-b-2 border-slate-300"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <button className="bg-vtk-yellow m-10 h-[2em]">Registreer</button>
        </form>
    );
}
