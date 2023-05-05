import { NextApiRequest, NextApiResponse } from 'next'
import { degrees, PDFDocument } from 'pdf-lib'
import { supabase } from '../../lib/supabaseClient';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {


    const urlTemplate = process.env.VERCEL_URL + "/blad.pdf"
    const pdfArrayBuffer = await fetch(urlTemplate).then(res => res.arrayBuffer())
    const doc = await PDFDocument.load(pdfArrayBuffer);
    const page = doc.getPage(0);

    const { data: bills, error } = await supabase.from("bills")
                    .select()
                    .eq('id', req.query.id)
                    .limit(1)



    if (error) {
        console.log(error)
        res.status(500)
        return
    }

    const fontSize = 13

    const bill = bills[0]
    console.log(bill)
    const activity: string = {bill.activity ? bill.activity : ""}
    page.drawText(activity, { x: 355,
        y: 805,
        size: fontSize
    });

    page.drawText(body.desc[0], {
        x: 195,
        y: 786,
        size: fontSize
    });

    page.drawText(body.post[0], {
        x: 150,
        y: 805,
        size: fontSize
    });


    page.drawText(body.name[0], {
        x: 150,
        y: 768,
        size: fontSize
    });

    page.drawText(body.date[0], {
        x: 162,
        y: 750,
        size: fontSize
    });

    if (body.payment_method[0] === "vtk") {
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

        if (body.iban[0] == null) {
            body.iban[0] = "";
        }

        page.drawText(body.iban[0], {
            x: 155,
            y: 715,
            size: fontSize
        });
    }


    // Afmetingen:590x600 
    const filename = req.files.photo[0].originalFilename
    var image = null;
    if (filename.endsWith('jpg') || filename.endsWith("jpeg")) {
        image = await doc.embedJpg(readFileSync(req.files.photo[0].path));
    } else {
        image = await doc.embedPng(readFileSync(req.files.photo[0].path));
    }

    const scaledDims = image.scaleToFit(580, 570);
    page.drawImage(image, {
        x: (590 - scaledDims.height) / 2,
        y: 590,
        width: scaledDims.width,
        height: scaledDims.height,
        rotate: degrees(-90)
    })

    writeFileSync("/home/rubenh/code/rekeningen/public/rekeningen/result.pdf", await doc.save());
    res.setHeader('Content-Type', 'application/pdf');
    res.send(await doc.save())
}


