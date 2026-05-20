const fs = require('fs');
async function run() {
  const res = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf');
  if (!res.ok) {
    console.error('Failed to fetch Amiri:', res.statusText);
    const res2 = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo-Regular.ttf');
    if (!res2.ok) {
        console.error('Failed to fetch Cairo:', res2.statusText);
        return;
    }
    const buffer = await res2.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    fs.mkdirSync('src/app/fonts', { recursive: true });
    fs.writeFileSync('src/app/fonts/arabic-font.ts', `export const ARABIC_FONT = '${base64}';\n`);
    console.log('Cairo Font saved. Length:', base64.length);
    return;
  }
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  fs.mkdirSync('src/app/fonts', { recursive: true });
  fs.writeFileSync('src/app/fonts/arabic-font.ts', `export const ARABIC_FONT = '${base64}';\n`);
  console.log('Amiri Font saved. Length:', base64.length);
}
run();
