import { Checkbox, Modal, Button, Group, Badge, Tooltip, Card, Text, Box, TextInput } from "@mantine/core";
import { IBill } from "../types";
import { AiFillEdit, AiOutlineDownload, AiOutlineDelete, AiOutlineMail } from "react-icons/ai";
import { useState } from "react";
import Link from "next/link";
import { notifications } from "@mantine/notifications";
import { DEST_MAIL_ADDRESS } from "../utils/constants";
import BillReportPreviewModal from "./BillReportPreviewModal";

interface IBillListItem {
    bill: IBill;
    onDelete?: () => void;
    adminMode?: boolean;
    isMobile?: boolean;
}

export default function BillListItem({ bill, onDelete, adminMode = false, isMobile = false }: IBillListItem) {
    const [paid, setPaid] = useState(bill.paid);
    const [booked, setBooked] = useState(bill.booked);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDownloadPreview, setShowDownloadPreview] = useState(false);
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [emailRecipient, setEmailRecipient] = useState(DEST_MAIL_ADDRESS);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    async function handleSendEmail(recipient: string, rotate = 0) {
        if (!adminMode) return false;
        setIsSendingEmail(true);
        try {
            const response = await fetch("/api/sendBillEmail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: bill.id, to: recipient, rotate }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to send email");
            
            notifications.show({ title: 'Success', message: `Email sent successfully to ${recipient}`, color: 'green' });
            return true;
        } catch (error: any) {
            console.error(error);
            notifications.show({ title: 'Error', message: error.message || 'Failed to send email', color: 'red' });
            return false;
        } finally {
            setIsSendingEmail(false);
        }
    }



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

    const downloadPreviewModal = (
        <BillReportPreviewModal
            opened={showDownloadPreview}
            billId={bill.id}
            title="Preview Report"
            description="Review the generated report before downloading it."
            primaryLabel="Download"
            primaryActionColor="blue"
            onClose={() => setShowDownloadPreview(false)}
            onPrimaryAction={({ blob, filename }) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                return true;
            }}
        />
    );

    const emailPreviewModal = (
        <BillReportPreviewModal
            opened={showEmailPreview}
            billId={bill.id}
            title="Preview Email Attachment"
            description={`Review the report before sending it to ${emailRecipient}.`}
            primaryLabel="Send email"
            primaryActionColor="dark"
            primaryActionLoading={isSendingEmail}
            onClose={() => setShowEmailPreview(false)}
            onPrimaryAction={({ rotate }) => handleSendEmail(emailRecipient, rotate)}
            extraContent={
                <div className="mb-4">
                    <TextInput
                        label="Send to"
                        value={emailRecipient}
                        onChange={(event) => setEmailRecipient(event.currentTarget.value)}
                        type="email"
                    />
                </div>
            }
        />
    );

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

                            <button onClick={() => setShowDownloadPreview(true)} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                <AiOutlineDownload size={16} />
                            </button>

                            {adminMode && (
                                <>
                                    <button onClick={() => {
                                        setEmailRecipient(DEST_MAIL_ADDRESS);
                                        setShowEmailPreview(true);
                                    }} disabled={isSendingEmail} className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${isSendingEmail ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}>
                                        <AiOutlineMail size={16} />
                                    </button>
                                    <button onClick={() => setShowDeleteModal(true)} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                                        <AiOutlineDelete size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </Card.Section>
                </Card>
                {downloadPreviewModal}
                {emailPreviewModal}


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
                <button onClick={() => setShowDownloadPreview(true)}><AiOutlineDownload /></button>
            </td>
            {adminMode && (
                <>
                    <td>
                        <button onClick={() => {
                            setEmailRecipient(DEST_MAIL_ADDRESS);
                            setShowEmailPreview(true);
                        }} disabled={isSendingEmail} className={isSendingEmail ? "opacity-50 cursor-not-allowed text-black" : "text-black"}><AiOutlineMail /></button>
                    </td>
                    <td>
                        <button onClick={() => setShowDeleteModal(true)}><AiOutlineDelete /></button>
                    </td>
                </>
            )}
            {downloadPreviewModal}
            {emailPreviewModal}



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
