const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

async function run() {
  const pdfPath = path.resolve(__dirname, "outputs", "test_output.pdf");
  if (!fs.existsSync(pdfPath)) {
    console.log("PDF does not exist");
    return;
  }
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  console.log("Total Pages:", pdfDoc.getPageCount());
  pdfDoc.getPages().forEach((page, i) => {
    console.log(`Page ${i + 1}: Width = ${page.getWidth()}, Height = ${page.getHeight()}`);
  });
}
run().catch(console.error);
