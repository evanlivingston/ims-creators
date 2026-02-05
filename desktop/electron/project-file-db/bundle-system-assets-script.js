import fs from 'node:fs'
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bundle_src_path = __dirname + "/system-assets";
const bundle_target_path = __dirname + "/system-assets-bundle.json";

const files = fs.readdirSync(bundle_src_path);

const result = {
    assets: [],
    workspaces: []
}
for (const file of files){
    if (/imw\.json$/.test(file)){
        const data = JSON.parse(fs.readFileSync(bundle_src_path + "/" + file, {
            encoding: 'utf8'
        }))
        result.workspaces.push(data)
    }
    else if (/ima\.json$/.test(file)){
        const data = JSON.parse(fs.readFileSync(bundle_src_path + "/" + file, {
            encoding: 'utf8'
        }))
        result.assets.push(data)
    }
}

fs.writeFileSync(bundle_target_path, JSON.stringify(result, null, 2), {
    encoding: 'utf-8'
} )