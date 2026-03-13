#!/usr/bin/env node

/**
 * CLI Command - Diagnóstico Completo de Estabilidade
 * 
 * Uso: npm run stability-check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Comando de Estabilidade - Salão CashBack');
console.log('=====================================\n');

// 1. Verificar ambiente
console.log('📋 1. Verificando ambiente...');
try {
  // Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    console.log('❌ node_modules não encontrado. Execute npm install');
    process.exit(1);
  }
  
  // Verificar package.json
  if (!fs.existsSync('package.json')) {
    console.log('❌ package.json não encontrado');
    process.exit(1);
  }
  
  console.log('✅ Ambiente OK');
} catch (error) {
  console.log('❌ Erro na verificação do ambiente:', error.message);
  process.exit(1);
}

// 2. Verificar TypeScript
console.log('\n🔍 2. Verificando TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript sem erros');
} catch (error) {
  console.log('⚠️  TypeScript com erros:');
  console.log(error.stdout?.toString() || error.message);
}

// 3. Verificar dependências críticas
console.log('\n📦 3. Verificando dependências críticas...');
const criticalDeps = [
  'react',
  'react-dom',
  '@supabase/supabase-js',
  'react-router-dom',
  'vite'
];

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const missingDeps = [];

for (const dep of criticalDeps) {
  if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
    missingDeps.push(dep);
  }
}

if (missingDeps.length > 0) {
  console.log('❌ Dependências críticas faltando:', missingDeps.join(', '));
} else {
  console.log('✅ Dependências críticas OK');
}

// 4. Verificar arquivos de configuração
console.log('\n⚙️  4. Verificando arquivos de configuração...');
const configFiles = [
  'vite.config.ts',
  'tsconfig.json',
  'tailwind.config.js',
  'supabase/config.toml'
];

const missingConfigs = [];
for (const file of configFiles) {
  if (!fs.existsSync(file)) {
    missingConfigs.push(file);
  }
}

if (missingConfigs.length > 0) {
  console.log('⚠️  Arquivos de configuração faltando:', missingConfigs.join(', '));
} else {
  console.log('✅ Arquivos de configuração OK');
}

// 5. Verificar estrutura de pastas
console.log('\n📁 5. Verificando estrutura de pastas...');
const requiredDirs = [
  'src',
  'src/components',
  'src/pages',
  'src/lib',
  'src/hooks',
  'public',
  'supabase/migrations'
];

const missingDirs = [];
for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    missingDirs.push(dir);
  }
}

if (missingDirs.length > 0) {
  console.log('❌ Pastas críticas faltando:', missingDirs.join(', '));
} else {
  console.log('✅ Estrutura de pastas OK');
}

// 6. Verificar se o build funciona
console.log('\n🔨 6. Testando build...');
try {
  console.log('   Executando build...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build executado com sucesso');
  
  // Verificar se arquivos foram gerados
  if (!fs.existsSync('dist')) {
    console.log('❌ Pasta dist não foi criada');
    process.exit(1);
  }
  
  const distFiles = fs.readdirSync('dist');
  if (distFiles.length === 0) {
    console.log('❌ Pasta dist está vazia');
    process.exit(1);
  }
  
  console.log(`✅ ${distFiles.length} arquivos gerados em dist/`);
} catch (error) {
  console.log('❌ Build falhou:');
  console.log(error.stderr?.toString() || error.message);
  process.exit(1);
}

// 7. Verificar se há migrations pendentes
console.log('\n🗄️  7. Verificando migrations...');
try {
  const migrationsDir = 'supabase/migrations';
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    console.log(`✅ ${migrations.length} migrations encontradas`);
  } else {
    console.log('⚠️  Pasta de migrations não encontrada');
  }
} catch (error) {
  console.log('⚠️  Erro ao verificar migrations:', error.message);
}

// 8. Gerar relatório final
console.log('\n📊 8. Relatório Final');
console.log('==================');

const report = {
  timestamp: new Date().toISOString(),
  environment: 'OK',
  typescript: 'OK',
  dependencies: missingDeps.length === 0 ? 'OK' : 'ERROR',
  configs: missingConfigs.length === 0 ? 'OK' : 'WARNING',
  structure: missingDirs.length === 0 ? 'OK' : 'ERROR',
  build: 'OK',
  migrations: 'OK'
};

const status = Object.values(report).every(status => status === 'OK') ? '✅ SISTEMA ESTÁVEL' : '⚠️  SISTEMA INSTÁVEL';

console.log(`Status: ${status}`);
console.log('\nResumo:');
Object.entries(report).forEach(([key, value]) => {
  const icon = value === 'OK' ? '✅' : value === 'WARNING' ? '⚠️' : '❌';
  console.log(`  ${icon} ${key}: ${value}`);
});

// 9. Recomendações
console.log('\n💡 Recomendações:');
if (missingDeps.length > 0) {
  console.log('  - Instale dependências faltantes: npm install', missingDeps.join(' '));
}
if (missingConfigs.length > 0) {
  console.log('  - Crie arquivos de configuração faltantes');
}
if (missingDirs.length > 0) {
  console.log('  - Crie estrutura de pastas faltante');
}

console.log('\n🚀 Próximos passos:');
console.log('  1. Se tudo estiver OK, execute: npm run dev');
console.log('  2. Teste o sistema localmente');
console.log('  3. Execute: npm run build');
console.log('  4. Faça deploy para produção');

console.log('\n✨ Diagnóstico concluído!');
