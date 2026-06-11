import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../lib/supabase';
import { requireAdmin } from '../../lib/authMiddleware';
import { Resend } from 'resend';
import { DEST_MAIL_ADDRESS, SOURCE_MAIL_ADDR } from '../../utils/constants';
import { buildBillReportPdf } from '../../lib/billReport';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

        const { id, to, rotate } = req.body;
        const billId = Number(id);
        if (!billId) {
            return res.status(400).json({ error: "Bill ID is required" });
        }

        const toAddress = typeof to === 'string' && to.trim() ? to.trim() : DEST_MAIL_ADDRESS;
        const rotateValue = Number(rotate) || 0;

        const { data: bills, error } = await supabase.from("bills")
            .select()
            .eq('id', billId)
            .limit(1);

        if (error || !bills || bills.length === 0) {
            return res.status(404).json({ error: "Bill not found" });
        }

        const bill = bills[0];

        const { data: photo, error: photoError } = await supabase.storage
            .from("bill_images")
            .download(bill.image);

        if (photoError) {
            return res.status(500).json({ error: photoError.message });
        }

        const imageBuffer = await photo.arrayBuffer();
        const { pdfBytes, filename: attachmentName } = await buildBillReportPdf(bill, imageBuffer, rotateValue);
        const pdfBuffer = Buffer.from(pdfBytes);

        // Send Email using Resend
        if (!process.env.RESEND_API_KEY) {
            return res.status(500).json({ error: "Resend API key is not configured" });
        }

        const subject = `[BILL] ${bill.post} - ${bill.name}`;
        const textBody = `Hi,\n\nThis automatic email contains the Bill: < ${bill.desc} > submitted by < ${bill.name} > from post < ${bill.post} > .\n\nKind regards.`;
        
        const fromAddress = process.env.RESEND_FROM_EMAIL || SOURCE_MAIL_ADDR;

        const { data, error: resendError } = await resend.emails.send({
            from: fromAddress,
            to: toAddress,
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
