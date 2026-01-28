import { NextApiRequest, NextApiResponse } from 'next';
import { degrees, PDFDocument, type PDFImage } from 'pdf-lib';
import { createAdminClient } from '../../lib/supabase';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../../lib/authMiddleware';


function getAcademicYearTag(date: Date, format: 'short' | 'long' = 'short'): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-based month
    const day = date.getDate();

    let startYear, endYear;
    if (month > 7 || (month === 7 && day >= 15)) {
        // After July 15th
        startYear = year;
        endYear = year + 1;
    } else {
        // Before July 15th
        startYear = year - 1;
        endYear = year;
    }

    if (format === 'long') {
        return `${startYear}-${endYear}`;
    } else {
        return `${startYear % 100}-${endYear % 100}`;
    }
}

/**
 * Replaces characters in the input string that are not allowed in a Content-Disposition header
 * with close matching characters or removes them if no close match is found.
 * 
 * @param str - The input string to be sanitized.
 * @returns The sanitized string with only allowed characters.
 */
const replaceBadCharacters = (str: string) => {
    const charMap: { [key: string]: string } = {
        'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
        'Ä': 'A', 'Ö': 'O', 'Ü': 'U',
        // Add more mappings as needed
    };
    return str.replace(/[^\w\s.-]/g, (char) => charMap[char] || '');
};

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

        // Now proceed with the PDF generation
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
        page.drawText(getAcademicYearTag(billDate, "long"), {
            x: 40,
            y: 715,
            size: fontSize
        });

        page.drawText(bill.activity, {
            x: 355,
            y: 805,
            size: fontSize
        });

        page.drawText(bill.desc, {
            x: 195,
            y: 786,
            size: fontSize
        });

        page.drawText(bill.post, {
            x: 150,
            y: 805,
            size: fontSize
        });


        page.drawText(bill.name, {
            x: 150,
            y: 768,
            size: fontSize
        });

        page.drawText(bill.date ? bill.date : "", {
            x: 162,
            y: 750,
            size: fontSize
        });

        if (bill.payment_method === "vtk") {
            page.drawText("X", {
                x: 232,
                y: 732,
                size: fontSize
            });
        } else {
            page.drawText("X", {
                x: 336,
                y: 732,
                size: fontSize
            });

            if (bill.iban == null) {
                bill.iban = "";
            }

            page.drawText(bill.iban, {
                x: 155,
                y: 715,
                size: fontSize
            });
        }


        // Afmetingen:590x600 
        const filename = bill.image;
        const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : "";
        let imageBuffer: ArrayBuffer = await photo.arrayBuffer()
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
                return res.status(500).json({ error: "Unknown file type." })
        }

        const rotate = Number(req.query.rotate) || 0;
        // I apologize for this iterative AI gunk of an if statement that actually works really well for centering and rotating images
        if (image !== null) {
            // 1. Normalize angle to 0, 90, 180, 270
            const angle = ((rotate % 360) + 360) % 360;
            const isSideways = angle === 90 || angle === 270;

            // 2. Scale image based on its final orientation
            const scaledDims = image.scaleToFit(
                isSideways ? 570 : 580,
                isSideways ? 580 : 570
            );

            const { width, height } = scaledDims;

            // 3. Define the center of the drawing area (Box: 590x600)
            const centerX = 590 / 2;
            const centerY = 600 / 2;

            // 4. Calculate the X and Y for the bottom-left corner based on rotation
            // This math offsets the "pivot" to keep the image centered
            const rad = (angle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            // This is the magic formula for rotating around a center point in PDF-lib
            const drawX = centerX - (width / 2) * cos + (height / 2) * sin;
            const drawY = centerY - (width / 2) * sin - (height / 2) * cos;

            page.drawImage(image, {
                x: drawX,
                y: drawY,
                width,
                height,
                rotate: degrees(angle),
            });
        }



        const pdfBytes = await doc.save()
        const downloadName = replaceBadCharacters(`${getAcademicYearTag(billDate)}_${bill.post}_${bill.activity}_${bill.desc}_${bill.amount / 100}.pdf`);

        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        const pdfBuffer = Buffer.from(pdfBytes);
        res.send(pdfBuffer);
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
