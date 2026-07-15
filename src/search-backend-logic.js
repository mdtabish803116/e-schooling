const fs = require('fs');
const path = require('path');

function search(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      search(fullPath, query);
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`FOUND "${query}" IN: ${fullPath}`);
      }
    }
  }
}

search('C:/e-school-api/e-schooling/src', 'module_masters');
search('C:/e-school-api/e-schooling/src', 'school_feature_overrides');
search('C:/e-school-api/e-schooling/src', 'sidebar');
