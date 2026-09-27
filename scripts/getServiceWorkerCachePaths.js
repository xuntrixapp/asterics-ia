const fs = require('fs');
const path = require('path');

const basePath = path.resolve(__dirname, '..');
const startDir = path.resolve(__dirname, '../app');
const outputFile = path.resolve(__dirname, '../serviceWorkerCachePaths.js');

let printPaths = ['./', 'index.html', 'unsupported.html'];

function shouldExclude(filePath) {
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.endsWith('.map') || 
        normalized.endsWith('.DS_Store') || 
        normalized.includes('/.git/') || 
        normalized.includes('node_modules') ||
        normalized.includes('.LICENSE.txt') ||
        normalized.includes('convertOriginalToTranslateObjects.js')) {
        return true;
    }
    return false;
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.lstatSync(fullPath);
        if (stat.isDirectory()) {
            traverseDir(fullPath);
        } else {
            const relPath = path.relative(basePath, fullPath).replace(/\\/g, '/');
            if (!shouldExclude(relPath)) {
                if (!printPaths.includes(relPath)) {
                    printPaths.push(relPath);
                }
            }
        }
    }
}

traverseDir(startDir);

printPaths.sort();

console.log(`[SW Generator] Total cached paths: ${printPaths.length}`);
fs.writeFileSync(outputFile, "self.URLS_TO_CACHE = " + JSON.stringify(printPaths, null, 2) + ";\n");
console.log(`[SW Generator] Written to ${outputFile}`);
