import { Checkbox, Modal, Button, Group, Badge, Tooltip, Card, Text, Box } from "@mantine/core";
import { IBill } from "../types";
import { AiFillEdit, AiOutlineDownload, AiOutlineDelete } from "react-icons/ai";
import { useState } from "react";
import Link from "next/link";
import { notifications } from "@mantine/notifications";

interface IBillListItem {
    bill: IBill;
    onDelete?: () => void;
    adminMode?: boolean;
    isMobile?: boolean;
}

export default function BillListItem({ bill, onDelete, adminMode = false, isMobile = false }: IBillListItem) {
    const [paid, setPaid] = useState(bill.paid);
    const [booked, setBooked] = useState(bill.booked);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [rotate, setRotate] = useState<0 | -90>(0);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);



    async function handlePaidChange(e: any) {
        if (!adminMode) return;
        const newValue = e.target.checked;
        setPaid(newValue);

        try {
            const response = await fetch("/api/setPaid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: bill.id, paid: newValue }),
            });

            if (!response.ok) throw new Error("Failed to update paid status");
        } catch (error) {
            console.error(error);
            setPaid(!newValue); // revert UI
            notifications.show({ title: 'Error', message: 'Failed to update payment status' });
        }
    }

    async function handleBookedChange(e: any) {
        if (!adminMode) return;
        const newValue = e.target.checked;
        setBooked(newValue);

        try {
            const response = await fetch("/api/setBooked", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: bill.id, booked: newValue }),
            });

            if (!response.ok) throw new Error("Failed to update booked status");
        } catch (error) {
            console.error(error);
            setBooked(!newValue); // revert UI
            notifications.show({ title: 'Error', message: 'Failed to update booked status' });
        }
    }

    async function handleDownload() {
        setIsDownloading(true);
        try {
            const response = await fetch(`/api/downloadReport?id=${bill.id}&rotate=${rotate}`);
            if (!response.ok) throw new Error("Failed to fetch report");

            const blob = await response.blob();
            setPdfBlob(blob);
            setShowPreviewModal(true);
        } catch (error) {
            console.error(error);
            notifications.show({ title: "Error", message: "Failed to preview report" });
        } finally {
            setIsDownloading(false);
        }
    }

    function handleConfirmDownload() {
        if (!pdfBlob) return;
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${bill.desc}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url); // clean up
    }


    async function handleDelete() {
        if (!adminMode) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/deleteBill?id=${bill.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Delete failed");

            notifications.show({ title: 'Success', message: 'Bill deleted successfully', color: 'green' });
            if (onDelete) onDelete();
        } catch (error: any) {
            console.error(error);
            notifications.show({ title: 'Error', message: error.message || 'Failed to delete bill', color: 'red' });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    }

    const editDisabled = paid;

    // Mobile Card view
    if (isMobile) {
        return (
            <>
                <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                    <Card.Section withBorder inheritPadding py="xs">
                        <div className="flex flex-col gap-1">
                            <Text weight={700} lineClamp={2}>{bill.desc}</Text>
                            <div className="flex items-center justify-between mt-1">
                                <Text size="sm" color="dimmed">{bill.date || "-"}</Text>

                                {/* Paid */}
                                {adminMode ? (
                                    <Checkbox checked={paid} onChange={handlePaidChange} label="Paid" labelPosition="left" />
                                ) : (
                                    <Badge color={paid ? "green" : "yellow"} variant="filled">
                                        {paid ? "Betaald" : "In behandeling"}
                                    </Badge>
                                )}

                                {/* Booked */}
                                {adminMode ? (
                                    <Checkbox checked={booked} onChange={handleBookedChange} label="Booked" labelPosition="left" />
                                ) : (
                                    <Badge color={booked ? "green" : "yellow"} variant="filled">
                                        {booked ? "Ingeboekt" : "In behandeling"}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card.Section>

                    <Box py="md">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Text size="sm" color="dimmed">Event:</Text>
                                <Text size="sm">{bill.activity || "-"}</Text>
                            </div>
                            <div>
                                <Text size="sm" color="dimmed">Post:</Text>
                                <Text size="sm">{bill.post || "-"}</Text>
                            </div>
                            <div>
                                <Text size="sm" color="dimmed">Name:</Text>
                                <Text size="sm">{bill.name || "-"}</Text>
                            </div>
                            <div>
                                <Text size="sm" color="dimmed">Amount:</Text>
                                <Text size="sm" weight={600}>€ {bill.amount ? (bill.amount / 100).toFixed(2) : "0.00"}</Text>
                            </div>
                        </div>
                    </Box>

                    <Card.Section withBorder inheritPadding py="xs">
                        <div className="flex justify-end gap-2">
                            {!editDisabled ? (
                                <Link href={`/edit-bill?id=${bill.id}`} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-gray-200">
                                    <AiFillEdit size={16} />
                                </Link>
                            ) : (
                                <Tooltip label="Betaalde rekeningen kunnen niet worden bewerkt" position="top" withArrow>
                                    <button disabled className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md bg-gray-200 text-gray-400 cursor-not-allowed">
                                        <AiFillEdit size={16} />
                                    </button>
                                </Tooltip>
                            )}

                            <button onClick={handleDownload} disabled={isDownloading} className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${isDownloading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {isDownloading ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : <AiOutlineDownload size={16} />}
                            </button>

                            {adminMode && (
                                <button onClick={() => setShowDeleteModal(true)} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                                    <AiOutlineDelete size={16} />
                                </button>
                            )}
                        </div>
                    </Card.Section>
                </Card>
                <Modal
                opened={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                size="xl"
                centered
                title={<Text weight={700} size="lg">Preview Report</Text>}
                padding="lg"
            >
                {/* Top button group */}
                <Group position="apart" mb="md">
                    <Group spacing="sm">
                        <Button onClick={handleConfirmDownload} disabled={isDownloading}>
                            Download
                        </Button>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                // toggle rotation
                                const newRotate = rotate === 0 ? -90 : 0;
                                setRotate(newRotate);

                                // refetch PDF with new rotation
                                setIsDownloading(true);
                                try {
                                    const response = await fetch(`/api/downloadReport?id=${bill.id}&rotate=${newRotate}`);
                                    if (!response.ok) throw new Error("Failed to fetch rotated report");

                                    const blob = await response.blob();
                                    setPdfBlob(blob);
                                } catch (error) {
                                    console.error(error);
                                    notifications.show({ title: "Error", message: "Failed to rotate report" });
                                } finally {
                                    setIsDownloading(false);
                                }
                            }}
                        >
                            Rotate 90°
                        </Button>
                    </Group>

                    <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                        Close
                    </Button>
                </Group>

                {/* Optional PDF preview removed for mobile */}
                <Text align="center" color="dimmed">
                    Use the buttons above to download or rotate the report.
                </Text>
            </Modal>


                <Modal opened={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion" centered>
                    <div>
                        <p className="mb-4">Are you sure you want to delete this bill?</p>
                        <p className="mb-4 font-bold">{bill.desc} - €{bill.amount ? (bill.amount / 100).toFixed(2) : "0.00"}</p>
                        <p className="mb-6 text-red-600">This action cannot be undone.</p>
                        <Group position="right">
                            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                            <Button color="red" onClick={handleDelete} loading={isDeleting}>Delete</Button>
                        </Group>
                    </div>
                </Modal>
            </>
        );
    }

    // Desktop table row view
    return (
        <tr>
            <td className="pr-4 break-words" style={{ maxWidth: '250px' }}>
                {bill.desc}
            </td>
            <td>{bill.activity}</td>
            <td>{bill.post}</td>
            <td>{bill.name}</td>
            <td>{bill.date}</td>
            <td>€ {bill.amount ? (bill.amount / 100).toFixed(2) : "0.00"}</td>
            <td>
                {adminMode ? (
                    <Checkbox checked={paid} onChange={handlePaidChange} />
                ) : (
                    <Badge color={paid ? "green" : "yellow"} variant="filled">{paid ? "Betaald" : "In behandeling"}</Badge>
                )}
            </td>
            <td>
                {adminMode ? (
                    <Checkbox checked={booked} onChange={handleBookedChange} />
                ) : (
                    <Badge color={booked ? "green" : "yellow"} variant="filled">{booked ? "Ingeboekt" : "In behandeling"}</Badge>
                )}
            </td>
            <td>
                {!editDisabled ? (
                    <Link href={`/edit-bill?id=${bill.id}`}>
                        <AiFillEdit />
                    </Link>
                ) : (
                    <Tooltip label="Betaalde rekeningen kunnen niet worden bewerkt" position="top" withArrow>
                        <button disabled><AiFillEdit /></button>
                    </Tooltip>
                )}
            </td>
            <td>
                <button onClick={handleDownload} disabled={isDownloading}><AiOutlineDownload /></button>
            </td>
            {adminMode && (
                <td>
                    <button onClick={() => setShowDeleteModal(true)}><AiOutlineDelete /></button>
                </td>
            )}
            <Modal
                opened={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                size="xl"
                centered
                title={<Text weight={700} size="lg">Preview Report</Text>}
                padding="lg"
            >
                {/* Top button group */}
                <Group position="apart" mb="md">
                    <Group spacing="sm">
                        <Button onClick={handleConfirmDownload} disabled={isDownloading}>
                            Download
                        </Button>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                const newRotate = rotate === 0 ? -90 : 0;
                                setRotate(newRotate);

                                setIsDownloading(true);
                                try {
                                    const response = await fetch(`/api/downloadReport?id=${bill.id}&rotate=${newRotate}`);
                                    if (!response.ok) throw new Error("Failed to fetch rotated report");

                                    const blob = await response.blob();
                                    setPdfBlob(blob);
                                } catch (error) {
                                    console.error(error);
                                    notifications.show({ title: "Error", message: "Failed to rotate report" });
                                } finally {
                                    setIsDownloading(false);
                                }
                            }}
                        >
                            Rotate -90°
                        </Button>
                    </Group>

                    <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                        Close
                    </Button>
                </Group>

                {/* PDF preview */}
                {pdfBlob ? (
                    <iframe
                        src={window.URL.createObjectURL(pdfBlob)}
                        style={{
                            width: '100%',
                            height: '80vh', // keep the height relative to modal
                            border: 'none',
                        }}
                    />
                ) : (
                    <Text align="center" color="dimmed">Loading preview...</Text>
                )}
            </Modal>



            <Modal opened={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion" centered>
                <div>
                    <p>Are you sure you want to delete this bill?</p>
                    <Group position="right">
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button color="red" onClick={handleDelete} loading={isDeleting}>Delete</Button>
                    </Group>
                </div>
            </Modal>
        </tr>
    );
}
