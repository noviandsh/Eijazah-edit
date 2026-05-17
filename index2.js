const express = require('express')
const fs = require('fs')
const { PDFDocument } = require('pdf-lib')
const multer = require('multer')

const upload = multer({ dest: 'uploads/' })

const app = express()

const addImageToPDF = async (pdfPath, photoPath, QRPath, outputPath, photoMime) => {
    const pdfBytes = fs.readFileSync(pdfPath)
    const photoBytes = fs.readFileSync(photoPath)
    const qrBytes = fs.readFileSync(QRPath)

    const pdfDoc = await PDFDocument.load(pdfBytes)

    const isPng = mime => mime === 'image/png'
    const isJpg = mime => mime === 'image/jpeg'

    let photo;
    if (isPng(photoMime)) {
        photo = await pdfDoc.embedPng(photoBytes);
    } else {
        photo = await pdfDoc.embedJpg(photoBytes);
    }

    let qr;
    if (QRPath.endsWith(".png")) {
        qr = await pdfDoc.embedPng(qrBytes);
    } else {
        qr = await pdfDoc.embedJpg(qrBytes);
    }

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    const xPhoto = 190
    const yPhoto = 80

    firstPage.drawImage(photo, {
        x: xPhoto,
        y: yPhoto,
        width: 96,
        height: 130
    })

    const xQR = 385
    const yQR = 120

    firstPage.drawImage(qr, {
        x: xQR,
        y: yQR,
        width: 60,
        height: 60
    })

    const modifiedPdfBytes = await pdfDoc.save()
    fs.writeFileSync(outputPath, modifiedPdfBytes)

    console.log("Gambar berhasil ditambahkan ke PDF: ", outputPath);
}

const multiUpload = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
])

app.use(express.static('public'))

app.post('/upload', multiUpload, (req, res) => {
    if (!req.files || !req.files['pdf'] || !req.files['photo']) {
        return res.status(400).send('Kedua file harus diunggah')
    }
    const pdfFilePath = req.files['pdf'][0].path
    const photoFilePath = req.files['photo'][0].path
    const outputName = req.files['photo'][0].originalname.split('.')[0]

    const photoMime = req.files['photo'][0].mimetype

    res.send(`File PDF: ${outputName}.pdf berhasil diedit`)
    // console.log(`File PDF: ${pdfFile.path}, Gambar: ${photoFile.path}`);
    addImageToPDF(pdfFilePath, photoFilePath, 'qr.png', `output/${outputName}.pdf`, photoMime)
})

app.listen(3000, () => console.log(`listening on ${3000}`))
// multer kurang multiple input field

