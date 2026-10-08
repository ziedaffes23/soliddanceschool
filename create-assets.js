const fs = require('fs');
const path = require('path');

function createSvgPlaceholder(name, category, w = 800, h = 1000) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <radialGradient id="grad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#112610" />
      <stop offset="100%" stop-color="#050505" />
    </radialGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#b6ff00" stroke-width="0.6" opacity="0.15"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" />
  <rect width="100%" height="100%" fill="url(#grid)" />
  <g fill="none" stroke="#b6ff00" stroke-width="1.5" opacity="0.4">
    <circle cx="${w/2}" cy="${h/2}" r="${w * 0.32}" stroke-dasharray="4,8" />
    <line x1="${w*0.1}" y1="${h*0.1}" x2="${w*0.9}" y2="${h*0.9}" stroke-dasharray="2,6" />
  </g>
  <text x="50%" y="48%" font-family="'Archivo', 'Helvetica Neue', Arial, sans-serif" font-size="${w*0.08}" font-weight="900" fill="#f2f2ee" letter-spacing="-0.05em" text-anchor="middle" text-transform="uppercase">
    ${name}
  </text>
  <text x="50%" y="55%" font-family="'Archivo', 'Helvetica Neue', Arial, sans-serif" font-size="${w*0.035}" font-weight="700" fill="#b6ff00" letter-spacing="0.15em" text-anchor="middle" text-transform="uppercase">
    SOLID / ${category}
  </text>
</svg>`;
}

const map = [
  { p: 'assets/images/hero/hero-dancer-bleed.svg', name: 'MOVEMENT', cat: 'HERO', w: 900, h: 1200 },
  { p: 'assets/images/styles/hip-hop.svg', name: 'HIP HOP', cat: 'STYLE 01', w: 800, h: 1000 },
  { p: 'assets/images/styles/house.svg', name: 'HOUSE', cat: 'STYLE 02', w: 800, h: 1000 },
  { p: 'assets/images/styles/breaking.svg', name: 'BREAKING', cat: 'STYLE 03', w: 800, h: 1000 },
  { p: 'assets/images/styles/contemporary.svg', name: 'CONTEMPORARY', cat: 'STYLE 04', w: 800, h: 1000 },
  { p: 'assets/images/styles/jazz.svg', name: 'JAZZ', cat: 'STYLE 05', w: 800, h: 1000 },
  { p: 'assets/images/styles/k-pop.svg', name: 'K-POP', cat: 'STYLE 06', w: 800, h: 1000 },
  { p: 'assets/images/styles/afro.svg', name: 'AFRO', cat: 'STYLE 07', w: 800, h: 1000 },
  { p: 'assets/images/styles/heels.svg', name: 'HEELS', cat: 'STYLE 08', w: 800, h: 1000 },
  { p: 'assets/images/school/studio-floor.svg', name: 'THE STUDIO', cat: 'FLOOR 01', w: 1000, h: 800 },
  { p: 'assets/images/school/studio-cypher.svg', name: 'THE CYPHER', cat: 'COLLECTIVE', w: 1000, h: 800 },
  { p: 'assets/images/teachers/tarak.svg', name: 'TARAK BOUZID', cat: 'HIP HOP & HOUSE', w: 800, h: 1000 },
  { p: 'assets/images/teachers/maya.svg', name: 'MAYA CHEN', cat: 'CONTEMPORARY', w: 800, h: 1000 },
  { p: 'assets/images/teachers/yassine.svg', name: 'YASSINE BEN AMOR', cat: 'BREAKING', w: 800, h: 1000 },
  { p: 'assets/images/teachers/selma.svg', name: 'SELMA DRIDI', cat: 'AFRO & HEELS', w: 800, h: 1000 },
  { p: 'assets/images/teachers/karim.svg', name: 'KARIM JEMAL', cat: 'JAZZ & K-POP', w: 800, h: 1000 },
  { p: 'assets/images/community/community-01.svg', name: 'COMMUNITY', cat: 'BACKSTAGE', w: 800, h: 1000 },
  { p: 'assets/images/community/community-02.svg', name: 'BATTLE NIGHT', cat: 'ENERGY', w: 1200, h: 800 },
  { p: 'assets/images/community/community-03.svg', name: 'CREW LIFE', cat: 'AFTER HOUR', w: 800, h: 1000 }
];

map.forEach(item => {
  const fullPath = path.join(__dirname, item.p);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, createSvgPlaceholder(item.name, item.cat, item.w, item.h), 'utf8');
});

console.log('Editorial SVG assets generated successfully');
