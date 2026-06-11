import fs from 'fs';
import path from 'path';
import { degrees, PDFDocument, type PDFImage } from 'pdf-lib';
import { IBill } from '../types';

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
    }

    return `${startYear % 100}-${endYear % 100}`;
}

const replaceBadCharacters = (str: string) => {
    const charMap: { [key: string]: string } = {
        'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
        'Ä': 'A', 'Ö': 'O', 'Ü': 'U',
    };

    return str.replace(/[^\w\s.-]/g, (char) => charMap[char] || '');
};

export async function buildBillReportPdf(bill: IBill, imageBuffer: ArrayBuffer, rotate = 0) {
    const filePath = path.resolve('./public', 'blad.pdf');
    const pdfReadBuffer = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(pdfReadBuffer);
    const page = doc.getPage(0);
    const fontSize = 13;
    const angle = ((rotate % 360) + 360) % 360;

    const billDate = new Date(bill.date ?? Date.now());
    page.drawText(getAcademicYearTag(billDate, 'long'), { x: 40, y: 715, size: fontSize });
    page.drawText(bill.activity || '', { x: 355, y: 805, size: fontSize });
    page.drawText(bill.desc || '', { x: 195, y: 786, size: fontSize });
    page.drawText(bill.post || '', { x: 150, y: 805, size: fontSize });
    page.drawText(bill.name || '', { x: 150, y: 768, size: fontSize });
    page.drawText(bill.date ? bill.date : '', { x: 162, y: 750, size: fontSize });

    if (bill.payment_method === 'vtk') {
        page.drawText('X', { x: 232, y: 732, size: fontSize });
    } else {
        page.drawText('X', { x: 336, y: 732, size: fontSize });
        page.drawText(bill.iban || '', { x: 155, y: 715, size: fontSize });
    }

    const filename = bill.image;
    const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
    let image: PDFImage | null = null;

    switch (extension) {
        case 'jpg':
        case 'jpeg':
            image = await doc.embedJpg(imageBuffer);
            break;
        case 'png':
            image = await doc.embedPng(imageBuffer);
            break;
        case 'pdf': {
            const pdfBill = await PDFDocument.load(imageBuffer);
            const pages = await doc.copyPages(pdfBill, pdfBill.getPageIndices());
            pages.forEach((pdfPage) => {
                pdfPage.setRotation(degrees(angle));
                doc.addPage(pdfPage);
            });
            break;
        }
        default:
            throw new Error('Unknown file type.');
    }

    if (image !== null) {
        const isSideways = angle === 90 || angle === 270;
        const scaledDims = image.scaleToFit(isSideways ? 570 : 580, isSideways ? 580 : 570);
        const { width, height } = scaledDims;
        const centerX = 590 / 2;
        const centerY = 600 / 2;
        const rad = (angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
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

    const pdfBytes = await doc.save();
    const filenameSafe = replaceBadCharacters(
        `${getAcademicYearTag(billDate)}_${bill.post}_${bill.activity}_${bill.desc}_${bill.amount / 100}.pdf`
    );

    return { pdfBytes, filename: filenameSafe };
}