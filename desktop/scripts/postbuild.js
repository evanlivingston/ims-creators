import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dist_client_path = path.join(__dirname, '..', 'dist-client', 'public');

// Fix paths
for (const file_name of ['index.html', '200.html', '404.html']){
    const file_loc = path.join(dist_client_path, file_name);
    const file_content = fs.readFileSync(file_loc, 'utf8');
    const fixed_content = file_content.replaceAll('/_nuxt/_nuxt/', '_nuxt/')
    fs.writeFileSync(file_loc, fixed_content, 'utf8');
}