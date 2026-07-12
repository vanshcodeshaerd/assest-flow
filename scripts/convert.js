const fs = require('fs');

let html = fs.readFileSync('assetflow1/index.html', 'utf8');

// Extract everything inside body, but before scripts
const bodyMatch = html.match(/<body>([\s\S]*?)<script/i);
if (!bodyMatch) {
  console.error("Could not find body content");
  process.exit(1);
}

let bodyHtml = bodyMatch[1];

// Conversions
bodyHtml = bodyHtml.replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
bodyHtml = bodyHtml.replace(/class=/g, 'className=');
bodyHtml = bodyHtml.replace(/for=/g, 'htmlFor=');

// Fix unclosed tags
bodyHtml = bodyHtml.replace(/<img(.*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<img${p1} />`;
});
bodyHtml = bodyHtml.replace(/<input(.*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<input${p1} />`;
});
bodyHtml = bodyHtml.replace(/<hr(.*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<hr${p1} />`;
});
bodyHtml = bodyHtml.replace(/<br(.*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<br${p1} />`;
});

// Inline styles conversion (basic logic for background: color; format)
bodyHtml = bodyHtml.replace(/style="([^"]*)"/g, (match, p1) => {
  const parts = p1.split(';').filter(p => p.trim() !== '');
  const styleObj = {};
  parts.forEach(part => {
    const [key, value] = part.split(':').map(s => s.trim());
    if (key && value) {
      // camelCase the key
      const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
      styleObj[camelKey] = value;
    }
  });
  return `style={${JSON.stringify(styleObj)}}`;
});

// SVG fixes (stroke-width -> strokeWidth, etc.)
bodyHtml = bodyHtml.replace(/stroke-width=/g, 'strokeWidth=');
bodyHtml = bodyHtml.replace(/stroke-linecap=/g, 'strokeLinecap=');
bodyHtml = bodyHtml.replace(/stroke-linejoin=/g, 'strokeLinejoin=');

const jsxTemplate = `
"use client";

import Script from 'next/script';
import { useEffect } from 'react';

export default function AdminDashboard() {
  return (
    <>
      <link rel="stylesheet" href="/admin-assets/styles.css" />
      <div className="admin-dashboard-container">
        ${bodyHtml}
      </div>
      
      <Script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" strategy="lazyOnload" />
      <Script src="/admin-assets/app.js" strategy="lazyOnload" />
    </>
  );
}
`;

fs.writeFileSync('src/app/admin/dashboard/page.tsx', jsxTemplate);
console.log('Successfully generated page.tsx');
