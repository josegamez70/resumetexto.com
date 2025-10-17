// netlify/functions/generate-pdf.js
const html_to_pdf = require('html-pdf-node');
const chromium = require('chrome-aws-lambda'); // Para usar Puppeteer en entornos serverless

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { html, filename } = JSON.parse(event.body);

        // Opciones para html-pdf-node
        let options = {
            format: 'A4',
            printBackground: true, // Esto es importante para que se impriman los colores de fondo
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            // Esto es crucial para usar puppeteer en Netlify Functions
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless
        };

        let file = { content: html };

        // Generar el PDF
        const pdfBuffer = await html_to_pdf.generatePdf(file, options);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
            body: pdfBuffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('Error generating PDF:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate PDF', details: error.message || 'Unknown error' }),
        };
    }
};