const express = require('express');
const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');

module.exports = (db) => {
  const router = express.Router();

  const mmToPt = (mm) => (mm * 72) / 25.4;
  const mmToDots = (mm, dpi = 203) => Math.round((mm * dpi) / 25.4);

  const STICKER_SPECS = {
    '30x40': {
      width: 30,
      height: 40,
      gap: 3,
      innerMargin: 2,
      nameFont: 12,
      skuFont: 8,
      priceFont: 18,
      barcodeHeight: 16,
      barcodeScale: 2,
      zpl: {
        nameFont: 30,
        skuFont: 20,
        priceFont: 40,
        nameY: 20,
        skuY: 70,
        barcodeY: 100,
        priceY: 220,
        barcodeHeight: 90,
      },
    },
    '15x30': {
      width: 15,
      height: 30,
      gap: 2,
      innerMargin: 1.5,
      nameFont: 8,
      skuFont: 6,
      priceFont: 12,
      barcodeHeight: 10,
      barcodeScale: 1,
      zpl: {
        nameFont: 20,
        skuFont: 14,
        priceFont: 24,
        nameY: 10,
        skuY: 45,
        barcodeY: 75,
        priceY: 150,
        barcodeHeight: 60,
      },
    },
    '12x30': {
      width: 12,
      height: 30,
      gap: 2,
      innerMargin: 1,
      nameFont: 7,
      skuFont: 5,
      priceFont: 10,
      barcodeHeight: 8,
      barcodeScale: 1,
      zpl: {
        nameFont: 18,
        skuFont: 12,
        priceFont: 20,
        nameY: 8,
        skuY: 40,
        barcodeY: 70,
        priceY: 140,
        barcodeHeight: 50,
      },
    },
    // Niimbot D110 compatible sizes (203 DPI)
    '12x40': {
      width: 12,
      height: 40,
      gap: 2,
      innerMargin: 1,
      nameFont: 7,
      skuFont: 5,
      priceFont: 10,
      barcodeHeight: 10,
      barcodeScale: 1,
      zpl: {
        nameFont: 18,
        skuFont: 12,
        priceFont: 20,
        nameY: 8,
        skuY: 50,
        barcodeY: 90,
        priceY: 190,
        barcodeHeight: 60,
      },
    },
    '15x50': {
      width: 15,
      height: 50,
      gap: 2,
      innerMargin: 1.5,
      nameFont: 9,
      skuFont: 7,
      priceFont: 14,
      barcodeHeight: 12,
      barcodeScale: 1.5,
      zpl: {
        nameFont: 24,
        skuFont: 16,
        priceFont: 28,
        nameY: 12,
        skuY: 60,
        barcodeY: 100,
        priceY: 240,
        barcodeHeight: 80,
      },
    },
  };

  const getProducts = () =>
    new Promise((resolve, reject) => {
      db.all(
        'SELECT id, name, sku, description AS barcode, price, selling_price, stock_quantity FROM products',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });

  const buildStickerQueue = (products) => {
    const stickers = [];
    products.forEach((product) => {
      const quantity = Number.parseInt(product.stock_quantity, 10) || 0;
      if (quantity <= 0) {
        return;
      }
      for (let i = 0; i < quantity; i += 1) {
        stickers.push(product);
      }
    });
    return stickers;
  };

  const sanitizeText = (text) => (text || '').toString().replace(/[\r\n]+/g, ' ').trim();

  const resolveBarcodeType = (barcode) => {
    if (!barcode) return 'code128';
    const trimmed = barcode.trim();
    if (/^[0-9]{12,13}$/.test(trimmed)) {
      return 'ean13';
    }
    return 'code128';
  };

  const generateBarcodeBuffer = async (barcode, specKey) => {
    if (!barcode) return null;
    const type = resolveBarcodeType(barcode);
    const spec = STICKER_SPECS[specKey];
    try {
      const buffer = await bwipjs.toBuffer({
        bcid: type,
        text: barcode,
        scale: spec.barcodeScale,
        height: spec.barcodeHeight,
        includetext: false,
      });
      return buffer;
    } catch (err) {
      console.warn('Failed to generate barcode, falling back to text', err.message);
      return null;
    }
  };

  const generatePdfBuffer = (stickers, sizeKey) => {
    const spec = STICKER_SPECS[sizeKey];
    const doc = new PDFDocument({ size: 'A4', margin: mmToPt(5) });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const stickerWidth = mmToPt(spec.width);
    const stickerHeight = mmToPt(spec.height);
    const gap = mmToPt(spec.gap);
    const innerMargin = mmToPt(spec.innerMargin);

    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const usableHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const columns = Math.max(1, Math.floor((usableWidth + gap) / (stickerWidth + gap)));
    const rowsPerPage = Math.max(1, Math.floor((usableHeight + gap) / (stickerHeight + gap)));

    const drawStickers = async () => {
      let column = 0;
      let row = 0;
      const barcodeCache = new Map();

      for (let index = 0; index < stickers.length; index += 1) {
        const product = stickers[index];
        const baseX = doc.page.margins.left + column * (stickerWidth + gap);
        const baseY = doc.page.margins.top + row * (stickerHeight + gap);

        doc.roundedRect(baseX, baseY, stickerWidth, stickerHeight, 4).stroke();

        const name = sanitizeText(product.name);
        const priceValue = Number(product.price ?? product.selling_price ?? 0).toFixed(2);
        const sku = sanitizeText(product.sku) || 'N/A';
        const barcodeValue = sanitizeText(product.barcode) || sanitizeText(product.sku);

        doc
          .font('Helvetica-Bold')
          .fontSize(spec.nameFont)
          .text(name || 'Unnamed Product', baseX + innerMargin, baseY + innerMargin, {
            width: stickerWidth - innerMargin * 2,
            align: 'center',
          });

        const priceY = baseY + stickerHeight - innerMargin - spec.priceFont - 2;
        doc
          .font('Helvetica-Bold')
          .fontSize(spec.priceFont)
          .text(`₪${priceValue}`, baseX + innerMargin, priceY, {
            width: stickerWidth - innerMargin * 2,
            align: 'center',
          });

        doc
          .font('Helvetica')
          .fontSize(spec.skuFont)
          .text(
            `SKU: ${sku}`,
            baseX + innerMargin,
            baseY + stickerHeight - innerMargin - spec.skuFont - spec.priceFont - 6,
            {
              width: stickerWidth - innerMargin * 2,
              align: 'center',
            }
          );

        if (barcodeValue) {
          const cacheKey = `${barcodeValue}-${sizeKey}`;
          let barcodeBuffer = barcodeCache.get(cacheKey);
          if (!barcodeBuffer) {
            // eslint-disable-next-line no-await-in-loop
            barcodeBuffer = await generateBarcodeBuffer(barcodeValue, sizeKey);
            barcodeCache.set(cacheKey, barcodeBuffer);
          }
          if (barcodeBuffer) {
            const barcodeWidth = stickerWidth - innerMargin * 2;
            const barcodeHeight = stickerHeight / 2.2;
            const barcodeY = baseY + stickerHeight / 2 - barcodeHeight / 2;
            doc.image(barcodeBuffer, baseX + innerMargin, barcodeY, {
              width: barcodeWidth,
              height: barcodeHeight,
              align: 'center',
            });
          } else {
            doc
              .font('Helvetica')
              .fontSize(spec.skuFont)
              .text(barcodeValue || 'NO BARCODE', baseX + innerMargin, baseY + stickerHeight / 2, {
                width: stickerWidth - innerMargin * 2,
                align: 'center',
              });
          }
        }

        column += 1;
        if (column >= columns) {
          column = 0;
          row += 1;
        }

        if (row >= rowsPerPage && index < stickers.length - 1) {
          doc.addPage();
          column = 0;
          row = 0;
        }
      }

      doc.end();
    };

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      drawStickers().catch((err) => {
        try {
          doc.removeAllListeners('end');
          doc.removeAllListeners('error');
        } catch (cleanupError) {
          console.error('Failed to clean up PDF listeners:', cleanupError);
        }
        try {
          doc.end();
        } catch (endError) {
          console.error('Failed to end PDF document after error:', endError);
        }
        reject(err);
      });
    });
  };

  const escapeZpl = (value) => sanitizeText(value).replace(/[\^~\\]/g, '');

  const generateZplContent = (stickers, sizeKey) => {
    const spec = STICKER_SPECS[sizeKey];
    // Niimbot D110 uses 203 DPI
    const widthDots = mmToDots(spec.width, 203);
    const heightDots = mmToDots(spec.height, 203);

    return stickers
      .map((product) => {
        const name = escapeZpl(product.name || '');
        const sku = escapeZpl(product.sku || '');
        const priceValue = Number(product.price ?? product.selling_price ?? 0).toFixed(2);
        const barcode = escapeZpl(product.barcode || product.sku || '');
        const type = resolveBarcodeType(barcode);
        const barcodeHeight = spec.zpl.barcodeHeight || 70;
        
        // Use CODE128 for better compatibility with Niimbot D110
        const barcodeCommand = type === 'ean13' 
          ? `^BEN,${barcodeHeight},Y,N,N` 
          : `^BCN,${barcodeHeight},Y,N,N`;

        const barcodeBlock = barcode
          ? `^FO10,${spec.zpl.barcodeY}${barcodeCommand}
^FD${barcode}^FS`
          : '';

        // Optimized ZPL for Niimbot D110 thermal printer (203 DPI)
        return (
          `^XA
^CF0,${spec.zpl.nameFont}
^PW${widthDots}
^LL${heightDots}
^FO10,${spec.zpl.nameY}^A0N,${spec.zpl.nameFont},${spec.zpl.nameFont}^FD${name}^FS
^FO10,${spec.zpl.skuY}^A0N,${spec.zpl.skuFont},${spec.zpl.skuFont}^FDSKU: ${sku}^FS
${barcodeBlock}
^FO10,${spec.zpl.priceY}^A0N,${spec.zpl.priceFont},${spec.zpl.priceFont}^FD₪${priceValue}^FS
^XZ`
        );
      })
      .join('\n');
  };

  router.post('/', async (req, res) => {
    try {
      const { size = '30x40', format = 'pdf' } = req.body || {};
      if (!STICKER_SPECS[size]) {
        return res.status(400).json({ error: 'Invalid sticker size.' });
      }

      const products = await getProducts();
      const stickers = buildStickerQueue(products);

      if (stickers.length === 0) {
        return res.status(400).json({ error: 'No stickers to generate. Ensure products have quantities greater than zero.' });
      }

      if (format === 'zpl') {
        const content = generateZplContent(stickers, size);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="stickers-${size}.zpl"`);
        return res.send(content);
      }

      const pdfBuffer = await generatePdfBuffer(stickers, size);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="stickers-${size}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('Failed to generate stickers:', err);
      return res.status(500).json({ error: 'Failed to generate stickers.' });
    }
  });

  return router;
};

