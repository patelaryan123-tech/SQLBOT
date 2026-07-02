const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    const filePath = path.resolve(req.file.path);
    const mimeType = req.file.mimetype;
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (mimeType.startsWith('image/')) {
      const { data } = await Tesseract.recognize(filePath, 'eng');
      extractedText = data.text;
    } else if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      extractedText = fs.readFileSync(filePath, 'utf-8');
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type.' });
    }

    // Clean up
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      text: extractedText,
      message: 'File processed successfully. Text extracted.'
    });

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ success: false, error: 'Failed to process the uploaded file.' });
  }
});

module.exports = router;
