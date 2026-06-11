import { Modal, Button, Group, Text } from "@mantine/core";
import { ReactNode, useEffect, useState } from "react";

type PreviewActionContext = {
    blob: Blob;
    filename: string;
    rotate: number;
};

interface BillReportPreviewModalProps {
    opened: boolean;
    billId: number;
    title: string;
    description: string;
    primaryLabel: string;
    onClose: () => void;
    onPrimaryAction: (preview: PreviewActionContext) => Promise<boolean | void> | boolean | void;
    primaryActionLoading?: boolean;
    primaryActionColor?: string;
    rotateLabel?: string;
    extraContent?: ReactNode;
}

export default function BillReportPreviewModal({
    opened,
    billId,
    title,
    description,
    primaryLabel,
    onClose,
    onPrimaryAction,
    primaryActionLoading = false,
    primaryActionColor = "dark",
    rotateLabel = "Rotate 90°",
    extraContent,
}: BillReportPreviewModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [rotate, setRotate] = useState(0);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [pdfFilename, setPdfFilename] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!opened) {
            setRotate(0);
            setPdfBlob(null);
            setPdfFilename("");
            setPreviewUrl(null);
            setError("");
            return;
        }

        void loadPreview(0);
    }, [opened, billId]);

    useEffect(() => {
        if (!pdfBlob) {
            setPreviewUrl(null);
            return;
        }

        const url = window.URL.createObjectURL(pdfBlob);
        setPreviewUrl(url);

        return () => window.URL.revokeObjectURL(url);
    }, [pdfBlob]);

    async function loadPreview(nextRotate: number) {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/downloadReport?id=${billId}&rotate=${nextRotate}`);
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.error || "Failed to fetch report");
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get("Content-Disposition");
            const filename = contentDisposition
                ? contentDisposition.split("filename=")[1].replace(/"/g, "")
                : "bill-report.pdf";

            setRotate(nextRotate);
            setPdfBlob(blob);
            setPdfFilename(filename);
        } catch (err: any) {
            setError(err?.message || "Failed to load preview");
        } finally {
            setIsLoading(false);
        }
    }

    async function handlePrimaryAction() {
        if (!pdfBlob) {
            return;
        }

        const result = await onPrimaryAction({ blob: pdfBlob, filename: pdfFilename, rotate });
        if (result !== false) {
            onClose();
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="xl"
            centered
            title={<Text weight={700} size="lg">{title}</Text>}
            padding="lg"
        >
            <Group position="apart" mb="md">
                <Group spacing="sm">
                    <Button onClick={handlePrimaryAction} disabled={isLoading || primaryActionLoading || !pdfBlob} loading={primaryActionLoading} color={primaryActionColor}>
                        {primaryLabel}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => void loadPreview((rotate - 90) % 360)}
                        disabled={isLoading || primaryActionLoading}
                    >
                        {rotateLabel}
                    </Button>
                </Group>

                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </Group>

            {extraContent}

            {error ? (
                <Text align="center" color="red">
                    {error}
                </Text>
            ) : previewUrl ? (
                <iframe
                    src={previewUrl}
                    style={{ width: '100%', height: '80vh', border: 'none' }}
                    title={title}
                />
            ) : (
                <Text align="center" color="dimmed">
                    {isLoading ? 'Loading preview...' : description}
                </Text>
            )}
        </Modal>
    );
}