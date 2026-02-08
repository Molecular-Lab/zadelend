
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');
const circomlibjs = require('circomlibjs');
const { MerkleTree } = require('fixed-merkle-tree');
const { toBytes32, bytes32ToBigInt } = require('./utils/bytesConverter');

const outPath = path.join(__dirname, '..');
const TREE_LEVELS = 2;

async function main() {
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  const poseidonHash = (inputs) => {
    if (!Array.isArray(inputs)) inputs = [inputs];
    const bigints = inputs.map(BigInt);
    const res = poseidon(bigints);
    return BigInt(F.toString(res));
  };

  const nullifier = 1;
  const secret = 2;
  const loanAmount = 900
  const commitment = poseidonHash([nullifier, secret, loanAmount])

  const leaves = [
    19014214495641488759237505126948346942972912379615652741039992445865937985820n,
    19014214495641488759237505126948346942972912379615652741039992445865937985820n,
    19014214495641488759237505126948346942972912379615652741039992445865937985820n,
    19014214495641488759237505126948346942972912379615652741039992445865937985820n
  ]
  leaves[0] = commitment;

  const tree = new MerkleTree(TREE_LEVELS, leaves, {
    hashFunction: (a, b) => poseidonHash([a, b]),
    zeroElement: 0n
  });

  const { pathElements, pathIndices, pathRoot } = tree.proof(commitment);

  const input = {
    root: pathRoot.toString(),
    nullifier: commitment.toString(),
    secret: ['1', '2'],
    loanAmount: '900',
    pathElements: pathElements.map((x) => x.toString()),    
    pathIndices: pathIndices.map((x) => x.toString())
  };

  const wasmPath = path.join(outPath, 'proof-source/withdraw_js/withdraw.wasm');
  const zkeyPath = path.join(outPath, 'proof-source/withdraw.zkey');
  const vkeyPath = path.join(outPath, 'proof-source/verification_key.json');

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  // const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  // const parsed = JSON.parse(`[${calldata}]`);
  // console.log(parsed)

  const vkey = JSON.parse(fs.readFileSync(vkeyPath));
  console.log('🔍 Verifying proof...');
  const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

  if (isValid) {
    console.log('✅ Proof is valid!');
  } else {
    console.log('❌ Invalid proof!');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
});
