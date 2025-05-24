import React, { useState, useEffect } from 'react';
import { Table, Loader } from "@mantine/core";
import { IBill } from "../types";
import { useSupabaseClient, useSession } from '../contexts/SupabaseContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AiOutlineDownload } from "react-icons/ai";
import { notifications } from '@mantine/notifications';

export default function MyBills() {
    const session = useSession();
    const supabase = useSupabaseClient();
    const router = useRouter();
    const [bills, setBills] = useState<IBill[]>([]);
    const [isDownloading, setIsDownloading] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserBills = async () => {
            if (session?.user) {
                setLoading(true);
                const { data, error } = await supabase
                    .from('bills')
                    .select('*')
                    .eq('uid', session.user.id)
                    .order('created_at', { ascending: false });
                
                if (!error) {
                    setBills(data || []);
                } else {
                    console.error("Error fetching bills:", error);
                }
                setLoading(false);
            }
        };

        fetchUserBills();
    }, [session, supabase]);

    // Redirect to home if not logged in
    if (session === null) {
        typeof window !== 'undefined' && router.push('/');
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    async function handleDownload(billId: number) {
        setIsDownloading(billId);
        try {
            const response = await fetch(`/api/downloadReport?id=${billId}`, {
                method: 'GET'
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                const contentDisposition = response.headers.get('Content-Disposition');
                const filename = contentDisposition ? contentDisposition.split('filename=')[1].replace(/"/g, '') : `bill_${billId}.pdf`;
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const errorText = await response.text();
                console.error("Download failed:", errorText);
                notifications.show({
                    title: 'Error',
                    message: 'Failed to download the report. Please try again later.',
                });
            }
        } catch (error) {
            console.error("Download error:", error);
            notifications.show({
                title: 'Error',
                message: 'Failed to download the report. Please try again later.',
            });
        } finally {
            setIsDownloading(null);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    return (
        <div className="w-3/4 m-16">
            <h1 className="text-3xl font-bold border-b-8 border-vtk-yellow mb-10">
                Mijn Rekeningen
            </h1>

            {bills.length > 0 ? (
                <Table className="min-w-full">
                    <thead className="border-b-4 border-vtk-yellow">
                        <tr>
                            <td className="pr-4"><b>Omschrijving</b></td>
                            <td className="pr-4"><b>Event</b></td>
                            <td className="pr-4"><b>Datum</b></td>
                            <td className="pr-4"><b>Bedrag</b></td>
                            <td className="pr-4"><b>Status</b></td>
                            <td className="pr-4"><b>Download</b></td>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-vtk-yellow">
                        {bills.map((bill: IBill) => (
                            <tr key={bill.id}>
                                <td><h2 className="text-l">{bill.desc}</h2></td>
                                <td>{bill.activity}</td>
                                <td>{bill.date}</td>
                                <td>€ {bill.amount ? (bill.amount / 100).toFixed(2) : "0.00"}</td>
                                <td>
                                    <div className={`rounded-full px-3 py-1 text-center text-sm ${bill.paid ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                        }`}>
                                        {bill.paid ? 'Betaald' : 'In behandeling'}
                                    </div>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDownload(bill.id)}
                                        disabled={isDownloading === bill.id}
                                        className={`inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md text-white ${isDownloading === bill.id ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                    >
                                        {isDownloading === bill.id ? (
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
                        ))}
                    </tbody>
                </Table>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-xl text-gray-600">Je hebt nog geen rekeningen ingediend.</h3>
                    <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
                        Dien een nieuwe rekening in
                    </Link>
                </div>
            )}
        </div>
    );
}
