import { Checkbox } from "@mantine/core";
import { IBill } from "../types";
import { AiFillEdit, AiOutlineDownload } from "react-icons/ai";
import { useState } from "react";

interface IBillListItem {
    bill: IBill;
}

export default function BillListItem({ bill }: IBillListItem) {
    const [paid, setPaid] = useState(bill.paid);
    const [isDownloading, setIsDownloading] = useState(false);

    async function handlePaidChange(e: any) {
        setPaid(e.target.checked);
        fetch("/api/setPaid", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: bill.id,
                paid: e.target.checked,
            }),
        });
    }

    async function handleDownload() {
        setIsDownloading(true);
        try {
            const supabaseProjectName = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1];
            const authToken = localStorage.getItem(`sb-${supabaseProjectName}-auth-token`);
            const token = authToken ? JSON.parse(authToken)["access_token"] : null;
            if (!token) {
                alert('Unauthorized');
                return;
            }

            const response = await fetch(`/api/downloadReport?id=${bill.id}`, {
                method: 'GET',
                headers: {
                    'x-supabase-token': token
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                const contentDisposition = response.headers.get('Content-Disposition');
                const filename = contentDisposition ? contentDisposition.split('filename=')[1].replace(/"/g, '') : `${bill.desc}.pdf`;
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Failed to download report');
            }
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <tr>
            <td>
                <h2 className="text-l"> {bill.desc} </h2>
            </td>
            <td>
                {bill.activity}
            </td>
            <td>
                {bill.name}
            </td>
            <td>
                {bill.date}
            </td>
            <td>
                € {bill.amount ? <>{(bill.amount / 100).toFixed(2)}</> : "0.00"}
            </td>
            <td>
                <Checkbox checked={paid} onChange={handlePaidChange} />
            </td>
            <td>
                <a href={`/editBill?id=${bill.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <AiFillEdit />
                </a>
            </td>
            <td>
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={`inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md text-white ${isDownloading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                    {isDownloading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <AiOutlineDownload className="h-5 w-5" />
                    )}
                </button>
            </td>
        </tr>
    );
}
