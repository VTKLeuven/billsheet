import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../lib/supabase';
import { requireAuth } from '../../lib/authMiddleware';
import { buildBillReportPdf } from '../../lib/billReport';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Check if user is authenticated (not necessarily admin)
        const { user, authorized } = await requireAuth(req, res);
        if (!authorized) return;

        // Create admin client for database operations
        const supabase = createAdminClient();

        // Get the bill ID from the request
        const billId = Number(req.query.id);
        if (!billId) {
            return res.status(400).json({ error: "Bill ID is required" });
        }

        const { data: bills, error } = await supabase.from("bills")
            .select()
            .eq('id', billId)
            .limit(1);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!bills || bills.length === 0) {
            return res.status(404).json({ error: "Bill not found" });
        }

        const bill = bills[0];

        // Only allow users to download their own bills unless they're an admin
        if (bill.uid !== user?.id && !user?.admin && (user?.allowed_posts == null)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const { data: photo, error: photoError } = await supabase.storage
            .from("bill_images")
            .download(bill.image);

        if (photoError) {
            return res.status(500).json({ error: photoError.message });
        }

        const rotate = Number(req.query.rotate) || 0;
        const imageBuffer = await photo.arrayBuffer();
        const { pdfBytes, filename: downloadName } = await buildBillReportPdf(bill, imageBuffer, rotate);

        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error("Download report error:", error);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};
