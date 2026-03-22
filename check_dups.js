const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function walk(currentDir) {
    let results = [];
    const list = fs.readdirSync(currentDir);
    list.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

try {
    const allFiles = walk(dir);
    const duplicates = allFiles.filter(f => f.includes(' (2)'));
    const diffMap = [];
    let exactMatches = 0;
    
    duplicates.forEach(dup => {
        const orig = dup.replace(' (2)', '');
        if (fs.existsSync(orig)) {
            const statDup = fs.statSync(dup);
            const statOrig = fs.statSync(orig);
            if (statDup.size !== statOrig.size) {
                diffMap.push({ 
                    file: orig.replace(dir, ''), 
                    origSize: statOrig.size, 
                    dupSize: statDup.size 
                });
            } else {
                exactMatches++;
            }
        }
    });
    
    console.log("CÓPIAS EXATAS (PODEM SER DELETADAS):", exactMatches);
    console.log("ARQUIVOS COM TAMANHOS DIFERENTES (PRECISAM DE MESCLA):");
    console.table(diffMap);
} catch (error) {
    console.error("Erro:", error);
}
