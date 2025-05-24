import { Checkbox, Modal, Button, Group, Badge } from "@mantine/core";
import { IBill } from "../types";
import { AiFillEdit, AiOutlineDownload, AiOutlineDelete } from "react-icons/ai";
import { useState } from "react";
import Link from "next/link";
import { notifications } from "@mantine/notifications";

interface IBillListItem {
    bill: IBill;
    onDelete?: () => void;
    adminMode?: boolean;
}

export default function BillListItem({ bill, onDelete, adminMode = false }: IBillListItem) {
    const [paid, setPaid] = useState(bill.paid);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    async function handlePaidChange(e: any) {
        // Only admins can change paid status
        if (!adminMode) return;
        
        setPaid(e.target.checked);

        try {
            const response = await fetch("/api/setPaid", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: bill.id,
                    paid: e.target.checked,
                }),
            });

            if (!response.ok) {
                setPaid(!e.target.checked); // Revert UI if request failed
                notifications.show({
                    title: 'Error',
                    message: 'Failed to update payment status',
                });
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            setPaid(!e.target.checked); // Revert UI on error
            notifications.show({
                title: 'Error',
                message: 'Failed to update payment status',
            });
        }
    }

    async function handleDownload() {
        setIsDownloading(true);
        try {
            const response = await fetch(`/api/downloadReport?id=${bill.id}`, {
                method: 'GET'
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
                notifications.show({
                    title: 'Error',
                    message: 'Failed to download report',
                });
            }
        } finally {
            setIsDownloading(false);
        }
    }

    async function handleDelete() {
        // Only admins can delete bills
        if (!adminMode) return;
        
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/deleteBill?id=${bill.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                notifications.show({
                    title: 'Success',
                    message: 'Bill deleted successfully',
                    color: 'green'
                });
                
                // Notify parent component to refresh the list
                if (onDelete) {
                    onDelete();
                }
            } else {
                const errorData = await response.json();
                notifications.show({
                    title: 'Error',
                    message: errorData.error || 'Failed to delete bill',
                    color: 'red'
                });
            }
        } catch (error) {
            console.error("Delete error:", error);
            notifications.show({
                title: 'Error',
                message: 'Failed to delete bill',
                color: 'red'
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    }

    // Determine if edit should be disabled (bill is paid)
    const editDisabled = paid;

    return (
        <>
            <tr>
                <td>
                    <h2 className="text-l"> {bill.desc} </h2>
                </td>
                <td>
                    {bill.activity}
                </td>
                <td>
                    {bill.post}
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
                    {adminMode ? (
                        // Admins see a checkbox
                        <Checkbox checked={paid} onChange={handlePaidChange} />
                    ) : (
                        // Regular users see a status badge
                        <Badge 
                            color={paid ? "green" : "yellow"}
                            variant="filled"
                        >
                            {paid ? "Betaald" : "In behandeling"}
                        </Badge>
                    )}
                </td>
                <td>
                    {editDisabled ? (
                        // Paid bills can't be edited - show disabled button
                        <button
                            disabled
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-gray-200 text-gray-400 cursor-not-allowed"
                        >
                            <AiFillEdit />
                        </button>
                    ) : (
                        // Unpaid bills can be edited
                        <Link href={`/editBill?id=${bill.id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <AiFillEdit />
                        </Link>
                    )}
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
                
                {/* Only show delete button if in admin mode */}
                {adminMode && (
                    <td>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <AiOutlineDelete className="h-5 w-5" />
                        </button>
                    </td>
                )}
            </tr>

            {/* Confirmation Modal */}
            <Modal
                opened={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Deletion"
                centered
            >
                <div>
                    <p className="mb-4">Are you sure you want to delete this bill?</p>
                    <p className="mb-4 font-bold">{bill.desc} - €{bill.amount ? (bill.amount / 100).toFixed(2) : "0.00"}</p>
                    <p className="mb-6 text-red-600">This action cannot be undone.</p>
                    
                    <Group position="right">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="red" 
                            onClick={handleDelete}
                            loading={isDeleting}
                        >
                            Delete
                        </Button>
                    </Group>
                </div>
            </Modal>
        </>
    );
}
