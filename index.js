const express = require('express')
const fs = require('fs')
const path = require('path')
const { PDFDocument } = require('pdf-lib')
const multer = require('multer')
const pdf = require('pdf-poppler')

const upload = multer({ dest: 'uploads/' })

const app = express()

app.set('view engine', 'ejs');

app.use(express.static('public'))

app.use(express.json())

app.use(express.urlencoded({
    extended: true
}))

app.use(
    '/preview',
    express.static('preview')
)
// bootstrap dari node_modules
app.use(
  '/bootstrap',
  express.static(
    path.join(__dirname, 'node_modules/bootstrap/dist')
  )
);

// fungsi untuk menambahkan image pada pdf
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
    } else if (isJpg(photoMime)) {
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

// app.use(express.static('public'))

//fungsi post /upload
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
    addImageToPDF(pdfFilePath, photoFilePath, 'qr.jpg', `output/${outputName}.pdf`, photoMime)
    console.log("edit")
})

//fungsi ambil nomor 
app.post('/upload_no', multiUpload, (req, res) => {
    console.log("nomor")
})

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/edit', (req, res) => {
    // jika request dari fetch/ajax
    if(req.headers['x-requested-with'] === 'XMLHttpRequest'){
        return res.render('edit');
    }else {
    }

    // jika reload browser
    res.render('index');
});

app.get('/nomor', (req, res) => {
    if(req.headers['x-requested-with'] === 'XMLHttpRequest'){
        return res.render('nomor');
    }

    res.render('index');
});

app.get('/setting', (req, res) => {
    // if(req.headers['x-requested-with'] === 'XMLHttpRequest'){
        const template =
            JSON.parse(
                fs.readFileSync(
                    './templates/template.json'
                )
            )
    //     return res.render('setting', { template });
    // }

    // res.render('index');
    res.render('setting', { template });
})

app.post('/save-setting', (req, res) => {

    const template = {

        photo: {

            x: Number(req.body.photo_x),

            y: Number(req.body.photo_y),

            width: Number(req.body.photo_width),

            height: Number(req.body.photo_height)

        },

        qr: {

            x: Number(req.body.qr_x),

            y: Number(req.body.qr_y),

            width: Number(req.body.qr_width),

            height: Number(req.body.qr_height)

        }

    }

    fs.writeFileSync(
        './templates/template.json',
        JSON.stringify(template, null, 2)
    )

    res.redirect('/setting')

})
app.post('/reset-setting', (req, res) => {

    const defaultTemplate =
        fs.readFileSync(
            './templates/template.default.json'
        )

    fs.writeFileSync(
        './templates/template.json',
        defaultTemplate
    )

    res.redirect('/setting')

})

app.post(
    '/upload-template',

    upload.single('pdf'),

    async (req, res) => {

        const pdfPath =
            req.file.path

        const options = {

            format: 'jpeg',

            out_dir: './preview',

            out_prefix: 'preview',

            page: 1,

            scale: 1000

        }

        try{

            await pdf.convert(
                pdfPath,
                options
            )

            res.redirect('/setting')

        }catch(err){

            console.log(err)

            res.send('Gagal convert PDF')

        }

    }
)
app.listen(3000, () => console.log(`Server berjalan di http://localhost:${3000}`))
// multer kurang multiple input field

