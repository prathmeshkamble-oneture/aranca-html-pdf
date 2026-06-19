const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const VIEWPORT = {
  width: 1440,
  height: 900,
};

const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
];

async function createBrowser() {
  return chromium.launch({
    headless: true,
    args: BROWSER_ARGS,
  });
}

function getPdfOptions(outputPath, compress = true) {
  return {
    path: outputPath,
    // format: "A4",
    width: "1440px",

    printBackground: true,

    preferCSSPageSize: true,

    margin: {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0",
    },

    displayHeaderFooter: false,

    ...(compress && {
      outline: false,
      tagged: false,
    }),
  };
}

async function convertHTMLtoPDF(htmlPath, outputPath, options = {}) {
  const { isRTL = false, landscape = false, compress = true } = options;

  const browser = await createBrowser();

  try {
    const page = await browser.newPage();

    await page.setViewportSize(VIEWPORT);

    await page.goto(`file://${htmlPath}`, {
      waitUntil: "networkidle",
    });

      await page.addStyleTag({
        content: `
      * {
        box-sizing: border-box;
      }

      p,
      span,
      div,
      article,
      ul,
      ol,
      li {
        break-inside: auto;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        break-after: avoid;
        page-break-after: avoid;
      }

      img {
        max-width: 100% !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      thead {
        display: table-header-group;
      }

      .highlight-box {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }

      .pdf-keep-together {
        break-inside: avoid;
        page-break-inside: avoid;
      }
     thead {
       display: table-row-group !important;
    }

      /*
       * Every section starts on a new page
       */
      body > section {
        break-before: page;
        page-break-before: always;
      }

      /*
       * First section starts normally on Page 1
       */
      body > section:first-of-type {
        break-before: auto;
        page-break-before: auto;
      }

      @page {
        margin: 0;
      }
    `,
      });
    
    
    // -------

    //   await page.addStyleTag({
    //     content: `
    //   * {
    //     box-sizing: border-box;
    //   }

    //   img {
    //     max-width: 100% !important;
    //   }

    //   h1,
    //   h2,
    //   h3,
    //   h4,
    //   h5,
    //   h6 {
    //     break-after: avoid;
    //     page-break-after: avoid;
    //   }

    //   /*
    //    * Every section starts on a new page
    //    */

    //   .full-bleed {
    //     display: none !important;
    //   }
    //   section {
    //     break-before: page;
    //     page-break-before: always;
    //   }

    //   /*
    //    * First section starts normally on Page 1
    //    */
    //   section:first-of-type {
    //     break-before: auto;
    //     page-break-before: auto;
    //   }

    //   /*
    //    * Allow highlight boxes to split naturally
    //    */
    //   .highlight-box {
    //     break-inside: auto !important;
    //     page-break-inside: auto !important;
    //   }

    //   @page {
    //     margin: 0;
    //   }
    // `,
    //   });

    //     await page.addStyleTag({
    //   content: `
    //     * {
    //       box-sizing: border-box;
    //     }

    //     section {
    //       break-before: page;
    //       page-break-before: always;
    //     }

    //     section:first-of-type {
    //       break-before: auto;
    //       page-break-before: auto;
    //     }

    //     thead {
    //       display: table-row-group !important;
    //     }

    //     .highlight-box {
    //       break-inside: auto !important;
    //       page-break-inside: auto !important;
    //     }

    //     img {
    //       max-width: 100% !important;
    //     }

    //     @page {
    //       margin: 0;
    //     }
    //   `,
    // });

  //   await page.addStyleTag({
  //     content: `
  //   * {
  //     box-sizing: border-box;
  //   }

  //   img,
  //   svg,
  //   canvas,
  //   video {
  //     max-width: 100% !important;
  //     height: auto !important;
  //   }

  //   h1,
  //   h2,
  //   h3,
  //   h4,
  //   h5,
  //   h6 {
  //     break-after: avoid;
  //     page-break-after: avoid;
  //   }

  //   /*
  //    * Every section starts on a new page
  //    */
  //   section {
  //     break-before: page;
  //     page-break-before: always;
  //   }

  //   /*
  //    * First section starts normally on page 1
  //    */
  //   section:first-of-type {
  //     break-before: auto;
  //     page-break-before: auto;
  //   }

  //   /*
  //    * Don't repeat table headers across pages
  //    */
  //   thead {
  //     display: table-row-group !important;
  //   }

  //   @page {
  //     margin: 0;
  //   }
  // `,
  //   });

    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "debug.png",
      fullPage: true,
    });

    await page.pdf(getPdfOptions(outputPath, compress));
    console.log(`✅ ${path.basename(outputPath)}`);
  } finally {
    await browser.close();
  }

  return outputPath;
}

// async function splitBySection(htmlPath, outputDir, sections, options = {}) {
//   const {
//     isRTL = false,
//     language = "en",
//     landscape = false,
//     compress = true,
//   } = options;
//   if (!sections || sections.length === 0) {
//     const fallback = path.join(outputDir, `document-full-${language}.pdf`);
//     await convertHTMLtoPDF(htmlPath, fallback, {
//       isRTL,
//       landscape,
//       compress,
//     });
//     return [{ name: `document-full-${language}.pdf`, path: fallback }];
//   }

//   const htmlContent = fs.readFileSync(htmlPath, "utf-8");
//   const generatedFiles = [];

//   const browser = await createBrowser();
//   try {
//     for (const section of sections) {
//       const safeName = section.id.replace(/[^a-zA-Z0-9-_]/g, "_");
//       const outPath = path.join(
//         outputDir,
//         `section-${safeName}-${language}.pdf`,
//       );
//       const tempPath = path.join(outputDir, `_temp_${safeName}.html`);

//       const isolationCSS = `
//         [data-section] { display: none !important; }
//         [data-section="${section.id}"] { display: block !important; }
//       `;
//       const modifiedHTML = htmlContent.replace(
//         "</head>",
//         `<style>${isolationCSS}</style></head>`,
//       );
//       fs.writeFileSync(tempPath, modifiedHTML, "utf-8");

//       const page = await browser.newPage();

//       await page.setViewportSize(VIEWPORT);
//       try {
//         await page.goto(`file://${tempPath}`, { waitUntil: "networkidle" });

//         await page.addStyleTag({
//           content: `
//             * { box-sizing: border-box; }
//             img { max-width: 100% !important; page-break-inside: avoid; }
//             p, h1, h2, h3, h4, h5, h6, li, tr { page-break-inside: avoid; }
//             section, article, div { page-break-inside: avoid; }
//           `,
//         });

//         await page.pdf(getPdfOptions(outPath, compress));

//         generatedFiles.push({
//           name: `section-${safeName}-${language}.pdf`,
//           path: outPath,
//         });
//         console.log(`✅  section-${safeName}-${language}.pdf`);
//       } finally {
//         await page.close();
//         try {
//           fs.unlinkSync(tempPath);
//         } catch { }
//       }
//     }
//   } finally {
//     await browser.close();
//   }

//   return generatedFiles;
// }

async function splitByPageRanges(
  fullPdfPath,
  outputDir,
  ranges,
  language = "en",
) {
  const { PDFDocument } = require("pdf-lib");
  const generatedFiles = [];

  const fullPdfBytes = fs.readFileSync(fullPdfPath);
  const fullPdf = await PDFDocument.load(fullPdfBytes);
  const totalPages = fullPdf.getPageCount();

  for (const range of ranges) {
    const safeName = range.name.replace(/[^a-zA-Z0-9-_]/g, "_");
    const outPath = path.join(outputDir, `${safeName}-${language}.pdf`);

    // Parse start/end — "end" means last page
    const start = Math.max(1, parseInt(range.from)) - 1; // 0-indexed
    const end =
      range.to === "end"
        ? totalPages
        : Math.min(parseInt(range.to), totalPages);

    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(
      fullPdf,
      Array.from({ length: end - start }, (_, i) => start + i),
    );
    pages.forEach((p) => newPdf.addPage(p));

    const pdfBytes = await newPdf.save();
    fs.writeFileSync(outPath, pdfBytes);

    generatedFiles.push({
      name: `${safeName}-${language}.pdf`,
      path: outPath,
      pages: `${start + 1}–${end}`,
    });
    console.log(`✅  ${safeName}-${language}.pdf (pages ${start + 1}–${end})`);
  }

  return generatedFiles;
}

// module.exports = { convertHTMLtoPDF, splitBySection, splitByPageRanges };
module.exports = { convertHTMLtoPDF, splitByPageRanges };
