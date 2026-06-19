const path = require('path');
const { convertHTMLtoPDF } = require('./pdfService');

async function test() {
  const htmlPath = path.resolve(__dirname, '..', 'najahi_business_banking_output 2 .html');
  const outputPath = path.resolve(__dirname, '..', 'test_output.pdf');
  
  console.log(`Generating PDF from: ${htmlPath}`);
  console.log(`Outputting to: ${outputPath}`);
  
  await convertHTMLtoPDF(htmlPath, outputPath, {
    compress: false
  });
  
  console.log('Done!');
}

test().catch(console.error);
