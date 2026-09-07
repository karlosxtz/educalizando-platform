import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '..', 'src');

async function processDirectory(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
      let content = await fs.readFile(fullPath, 'utf8');
      let changed = false;

      // Regular expression to match any version of the logo src
      const regex = /src=["']\/branding\/logo-educalizando\.png(\?v=\d+)?["']/g;
      const newContent = content.replace(regex, (match) => {
        changed = true;
        return 'src="/branding/logo-educalizando.png?v=3"';
      });

      // Also replace logo-educalizando-icon.png just in case
      const iconRegex = /src=["']\/branding\/logo-educalizando-icon\.png(\?v=\d+)?["']/g;
      const newContent2 = newContent.replace(iconRegex, (match) => {
        changed = true;
        return 'src="/branding/logo-educalizando-icon.png?v=3"';
      });
      
      // Also layout.tsx metadata icons if any
      const ogRegex = /url:\s*['"]\/branding\/logo-og\.png(\?v=\d+)?['"]/g;
      const newContent3 = newContent2.replace(ogRegex, (match) => {
        changed = true;
        return "url: '/branding/logo-og.png?v=3'";
      });
      
      const imagesOgRegex = /images:\s*\[['"]\/branding\/logo-og\.png(\?v=\d+)?['"]\]/g;
      const newContent4 = newContent3.replace(imagesOgRegex, (match) => {
        changed = true;
        return "images: ['/branding/logo-og.png?v=3']";
      });

      if (changed) {
        await fs.writeFile(fullPath, newContent4, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir).then(() => console.log('Done.')).catch(console.error);
