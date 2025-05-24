import React, { useState, useEffect } from 'react';
import { Table, Loader } from "@mantine/core";
import { IBill } from "../types";
import BillListItem from "./BillListItem";

interface IBillList {
    adminMode?: boolean; // Indicates whether to fetch all bills (admin) or just user bills
}

export default function BillList({ adminMode = false }: IBillList) {
    const [showUnpaid, setShowUnpaid] = useState(false);
    const [bills, setBills] = useState<IBill[]>([]);
    const [loading, setLoading] = useState(true);

    // Function to fetch bills
    const fetchBills = async () => {
        setLoading(true);
        try {
            // Use the admin endpoint if in admin mode, otherwise fetch user's own bills
            const endpoint = adminMode ? '/api/getAllBills' : '/api/getUserBills';
            const response = await fetch(endpoint);

            if (!response.ok) {
                // Handle unauthorized or error responses
                if (response.status === 401 || response.status === 403) {
                    console.error("Access denied");
                } else {
                    console.error("Error fetching bills:", await response.text());
                }
                setBills([]);
            } else {
                const data = await response.json();
                setBills(data.bills || []);
            }
        } catch (error) {
            console.error("Error fetching bills:", error);
            setBills([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch bills when component mounts
    useEffect(() => {
        fetchBills();
    }, [adminMode]);

    const toggleShowUnpaid = () => {
        setShowUnpaid(!showUnpaid);
    };

    const filteredBills = showUnpaid ? bills.filter(bill => !bill.paid) : bills;

    // Function to handle when a bill is deleted
    const handleBillDeleted = () => {
        fetchBills();
    };

    if (loading && bills.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    return (
        <div className="w-3/4 m-16">
            <h1 className="text-3xl font-bold border-b-8 border-vtk-yellow mb-10">
                {adminMode ? 'All Bills' : 'My Bills'}
            </h1>
            <div className="flex justify-end mb-4">
                <label className="flex items-center space-x-2">
                    <input
                        type='checkbox'
                        checked={showUnpaid}
                        onChange={toggleShowUnpaid}
                        className="form-checkbox h-5 w-5 text-blue-600">
                    </input>
                    <span className="text-lg">Show Unpaid Bills</span>
                </label>
            </div>
            {bills.length > 0 ? (
                <Table className="min-w-full">
                    <thead className="border-b-4 border-vtk-yellow">
                        <tr>
                            <td className="pr-4">
                                <b>Omschrijving</b>
                            </td>
                            <td className="pr-4">
                                <b>Event</b>
                            </td>
                            <td className="pr-4">
                                <b>Post</b>
                            </td>
                            <td className="pr-4">
                                <b>Naam</b>
                            </td>
                            <td className="pr-4">
                                <b>Datum</b>
                            </td>
                            <td className="pr-4">
                                <b>Bedrag</b>
                            </td>
                            <td className="pr-4">
                                <b>Betaald</b>
                            </td>
                            <td>
                                <b>Actions</b>
                            </td>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-vtk-yellow">
                        {filteredBills.map((bill: IBill) => (
                            <BillListItem
                                key={bill.id}
                                bill={bill}
                                onDelete={handleBillDeleted}
                                adminMode={adminMode}
                            />
                        ))}
                    </tbody>
                </Table>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-xl text-gray-600">No bills found</h3>
                </div>
            )}
        </div >
    );
}
