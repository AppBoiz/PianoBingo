const fs = require('fs');

// Test the PDF extraction regex
const allPdfsPath = '/mnt/D/projects/PianoBingo/resources/base64/all_pdfs.js';
const content = fs.readFileSync(allPdfsPath, 'utf8');

const pdfRegex = /const\s+(\w+)\s*=\s*['"]([A-Za-z0-9+/=]+)['"]/g;

let match;
let count = 0;
const samples = [];

while ((match = pdfRegex.exec(content)) !== null) {
  count++;
  const [, varName, base64Data] = match;
  if (samples.length < 3) {
    samples.push({
      varName,
      base64Length: base64Data.length,
      base64Start: base64Data.substring(0, 20)
    });
  }
}

console.log(`✓ Found ${count} PDFs in all_pdfs.js\n`);
console.log('Sample extractions:');
samples.forEach((s, i) => {
  console.log(`  ${i + 1}. ${s.varName}: ${s.base64Length} chars, starts with: ${s.base64Start}...`);
});

// Also test pack_jack.js
const packJackPath = '/mnt/D/projects/PianoBingo/resources/base64/pack_jack.js';
if (fs.existsSync(packJackPath)) {
  const packJackContent = fs.readFileSync(packJackPath, 'utf8');
  const jackMatch = /const\s+(\w+)\s*=\s*['"]([A-Za-z0-9+/=]+)['"]/g.exec(packJackContent);
  if (jackMatch) {
    console.log(`\n✓ pack_jack.js: Found "${jackMatch[1]}" (${jackMatch[2].length} chars)`);
  }
}

// Also test pack_tom.js
const packTomPath = '/mnt/D/projects/PianoBingo/resources/base64/pack_tom.js';
if (fs.existsSync(packTomPath)) {
  const packTomContent = fs.readFileSync(packTomPath, 'utf8');
  const tomMatch = /const\s+(\w+)\s*=\s*['"]([A-Za-z0-9+/=]+)['"]/g.exec(packTomContent);
  if (tomMatch) {
    console.log(`✓ pack_tom.js: Found "${tomMatch[1]}" (${tomMatch[2].length} chars)`);
  }
}
