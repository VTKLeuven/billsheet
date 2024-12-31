import { NextApiRequest, NextApiResponse } from 'next'
import { degrees, PDFDocument, type PDFImage } from 'pdf-lib'
import { supabase } from '../../lib/supabaseClient';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const filePath = path.resolve("./public", "blad.pdf")
    const pdfReadBuffer = fs.readFileSync(filePath)
    const doc = await PDFDocument.load(pdfReadBuffer);
    const page = doc.getPage(0);

    const { data: bills, error } = await supabase.from("bills")
        .select()
        .eq('id', Number(req.query.id))
        .limit(1)

    if (error) {
        res.status(500).json({ error: error.message })
        return
    }

    const fontSize = 13
    const bill = bills[0]

    const { data: photo, error: photoError } = await supabase.storage
        .from("bill_images")
        .download(bill.image)

    if (photoError) {
        res.status(500).json({ error: photoError.message })
        return
    }

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
            res.status(500).json({ error: "Unknown file type." })
            return;
    }

    if (image !== null) {
        const scaledDims = image.scaleToFit(580, 570);
        page.drawImage(image, {
            x: (590 - scaledDims.height) / 2,
            y: 590,
            width: scaledDims.width,
            height: scaledDims.height,
            rotate: degrees(-90)
        })
    }

    const pdfBytes = await doc.save()
    res.setHeader('Content-Disposition', `attachment; filename="rekening-${bill.desc}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    const pdfBuffer = Buffer.from(pdfBytes);
    res.send(pdfBuffer);
}

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};
