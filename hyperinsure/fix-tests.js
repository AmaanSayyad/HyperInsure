const fs = require('fs');

// Fix test files
const files = [
  'tests/hyperinsure-core.test.ts',
  'tests/oracle.test.ts',
  'tests/governance.test.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix expectSome() calls
  content = content.replace(/const (\w+) = (\w+)\.expectSome\(\);/g, 'const $1 = Cl.unwrapSome($2);');
  
  // Fix getDataVar with Number() to BigInt
  content = content.replace(/const initialCount = Number\(countBefore\);/g, 'const initialCount = BigInt(countBefore);');
  content = content.replace(/const initialCount = Number\((\w+)\);/g, 'const initialCount = BigInt($1);');
  content = content.replace(/const initialDeposits = Number\(depositsBefore\);/g, 'const initialDeposits = BigInt(depositsBefore);');
  
  // Fix toBeUint with addition
  content = content.replace(/expect\((\w+)\)\.toBeUint\(initialCount \+ 1\);/g, 'expect($1).toBeUint(initialCount + 1n);');
  content = content.replace(/expect\((\w+)\)\.toBeUint\(initialDeposits \+ 300000\);/g, 'expect($1).toBeUint(initialDeposits + 300000n);');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('All test files fixed!');
