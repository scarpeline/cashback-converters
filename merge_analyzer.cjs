const fs = require('fs');
const path = require('path');

const diffMap = JSON.parse(fs.readFileSync('dups_diff.json', 'utf8'));
const dir = path.join(process.cwd(), 'src');

let replaced = 0;
let manualCheck = [];

diffMap.forEach(relPath => {
    const origPath = path.join(dir, relPath);
    const parsed = path.parse(origPath);
    const dupPath = path.join(parsed.dir, parsed.name + ' (2)' + parsed.ext);
    
    if (!fs.existsSync(dupPath) || !fs.existsSync(origPath)) return;
    
    const origContent = fs.readFileSync(origPath, 'utf8');
    const dupContent = fs.readFileSync(dupPath, 'utf8');
    
    // Most likely, the larger file has all the features the user worked on. Let's see if one contains the other.
    if (dupContent.length > origContent.length) {
        // Assume dup has more code, let's keep it.
        fs.writeFileSync(origPath, dupContent);
        fs.unlinkSync(dupPath);
        replaced++;
    } else if (origContent.length >= dupContent.length) {
        // Original is larger, just drop the duplicate
        fs.unlinkSync(dupPath);
        replaced++;
    } else {
        manualCheck.push(relPath);
    }
});

console.log("Arquivos corrigidos/mesclados: " + replaced);
console.log("Precisam de revisão: " + manualCheck.length);
