const path = require('path');
const { convertHTMLtoPDF } = require('./pdfService');

async function test() {
  const htmlPath = path.resolve(__dirname, "exports", "najahi_business_banking_output_lts.html");
  const outputPath = path.resolve(__dirname, "outputs", "test_output.pdf");
  
  console.log(`Generating PDF from: ${htmlPath}`);
  console.log(`Outputting to: ${outputPath}`);
  
  await convertHTMLtoPDF(htmlPath, outputPath, {
    compress: false
  });
  
  console.log('Done!');
}

test().catch(console.error);
