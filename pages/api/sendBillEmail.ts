import { NextApiRequest, NextApiResponse } from 'next';
import { degrees, PDFDocument, type PDFImage } from 'pdf-lib';
import { createAdminClient } from '../../lib/supabase';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../../lib/authMiddleware';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

function getAcademicYearTag(date: Date, format: 'short' | 'long' = 'short'): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let startYear, endYear;
    if (month > 7 || (month === 7 && day >= 15)) {
        startYear = year;
        endYear = year + 1;
    } else {
        startYear = year - 1;
        endYear = year;
    }

    if (format === 'long') {
        return `${startYear}-${endYear}`;
    } else {
        return `${startYear % 100}-${endYear % 100}`;
    }
}

const replaceBadCharacters = (str: string) => {
    const charMap: { [key: string]: string } = {
        'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
        'Ä': 'A', 'Ö': 'O', 'Ü': 'U',
    };
    return str.replace(/[^\w\s.-]/g, (char) => charMap[char] || '');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Only allow super admins to send emails
        const { user, authorized } = await requireAdmin(req, res);
        if (!authorized || !user?.admin) {
            return res.status(403).json({ error: 'Super admin access required' });
        }

        const supabase = createAdminClient();

        const { id } = req.body;
        const billId = Number(id);
        if (!billId) {
            return res.status(400).json({ error: "Bill ID is required" });
        }

        const { data: bills, error } = await supabase.from("bills")
            .select()
            .eq('id', billId)
            .limit(1);

        if (error || !bills || bills.length === 0) {
            return res.status(404).json({ error: "Bill not found" });
        }

        const bill = bills[0];

        // Generate PDF
        const filePath = path.resolve("./public", "blad.pdf");
        const pdfReadBuffer = fs.readFileSync(filePath);
        const doc = await PDFDocument.load(pdfReadBuffer);
        const page = doc.getPage(0);
        const fontSize = 13;

        const { data: photo, error: photoError } = await supabase.storage
            .from("bill_images")
            .download(bill.image);

        if (photoError) {
            return res.status(500).json({ error: photoError.message });
        }

        const billDate = new Date(bill.date ?? Date.now());
        page.drawText(getAcademicYearTag(billDate, "long"), { x: 40, y: 715, size: fontSize });
        page.drawText(bill.activity || "", { x: 355, y: 805, size: fontSize });
        page.drawText(bill.desc || "", { x: 195, y: 786, size: fontSize });
        page.drawText(bill.post || "", { x: 150, y: 805, size: fontSize });
        page.drawText(bill.name || "", { x: 150, y: 768, size: fontSize });
        page.drawText(bill.date ? bill.date : "", { x: 162, y: 750, size: fontSize });

        if (bill.payment_method === "vtk") {
            page.drawText("X", { x: 232, y: 732, size: fontSize });
        } else {
            page.drawText("X", { x: 336, y: 732, size: fontSize });
            page.drawText(bill.iban || "", { x: 155, y: 715, size: fontSize });
        }

        const filename = bill.image;
        const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : "";
        let imageBuffer: ArrayBuffer = await photo.arrayBuffer();
        let image: PDFImage | null = null;
        
        switch (extension) {
            case "jpg":
            case "jpeg":
                image = await doc.embedJpg(imageBuffer);
                break;
            case "png":
                image = await doc.embedPng(imageBuffer);
                break;
            case "pdf":
                const pdfBill = await PDFDocument.load(imageBuffer);
                const pages = await doc.copyPages(pdfBill, pdfBill.getPageIndices());
                pages.forEach(page => doc.addPage(page));
                break;
            default:
                return res.status(500).json({ error: "Unknown file type." });
        }

        if (image !== null) {
            const scaledDims = image.scaleToFit(580, 570);
            const { width, height } = scaledDims;
            const centerX = 590 / 2;
            const centerY = 600 / 2;
            const drawX = centerX - (width / 2);
            const drawY = centerY - (height / 2);

            page.drawImage(image, {
                x: drawX,
                y: drawY,
                width,
                height,
                rotate: degrees(0),
            });
        }

        const pdfBytes = await doc.save();
        const pdfBuffer = Buffer.from(pdfBytes);
        const attachmentName = replaceBadCharacters(`${getAcademicYearTag(billDate)}_${bill.post}_${bill.activity}_${bill.desc}_${(bill.amount / 100).toFixed(2)}.pdf`);

        // Send Email using Resend
        if (!process.env.RESEND_API_KEY) {
            return res.status(500).json({ error: "Resend API key is not configured" });
        }

        const subject = `[BILL] ${bill.post} - ${bill.name}`;
        const textBody = `Hi,\n\nThis automatic email contains the Bill: < ${bill.desc} > submitted by < ${bill.name} > from post < ${bill.post} > .\n\nKind regards.`;
        
        const { data, error: resendError } = await resend.emails.send({
            from: 'onboarding@resend.dev', // Using Resend's default sender if no domain is configured
            to: 'beheer@vtk.be',
            subject: subject,
            text: textBody,
            attachments: [
                {
                    filename: attachmentName,
                    content: pdfBuffer,
                }
            ]
        });

        if (resendError) {
            console.error("Resend error:", resendError);
            return res.status(500).json({ error: resendError.message });
        }

        return res.status(200).json({ message: 'Email sent successfully', data });

    } catch (error) {
        console.error("Send email error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}
