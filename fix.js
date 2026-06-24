const fs = require('fs');
const path = require('path');

function replaceFontWeight(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(/fontWeight="bold"/g, "sx={{ fontWeight: 'bold' }}");
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log('Updated ' + filePath);
  }
}

const dirs = [
  'src/app/page.tsx',
  'src/components/Auth/AuthUI.tsx',
  'src/components/Discovery/DiscoveryDialog.tsx',
  'src/components/Map/ConstellationMap.tsx',
  'src/components/Media/MediaDetail.tsx',
  'src/components/Media/TrackingForm.tsx',
  'src/components/Search/AniListSearch.tsx'
];

dirs.forEach(f => replaceFontWeight(path.join(process.cwd(), f)));
