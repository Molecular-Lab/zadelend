const circomlibjs = require("circomlibjs");
const { MerkleTree } = require("fixed-merkle-tree");
const { toBytes32 } = require('./utils/bytesConverter');

(async () => {
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  const poseidonHash = (inputs) => {
    if (!Array.isArray(inputs)) inputs = [inputs];
    const bigints = inputs.map(BigInt);
    const res = poseidon(bigints);
    return BigInt(F.toString(res));
  };

  const TREE_LEVELS = 2;

  const rawLeaves = [0, 0, 0, 0];
  const leaves = rawLeaves.map(x => poseidonHash(x));
  leaves[0] = poseidonHash([1, 2, 900]);
  leaves[1] = poseidonHash([2, 3, 900]);
  // leaves[2] = poseidonHash([3, 4, 900]);
  // leaves[3] = poseidonHash([4, 5, 900]);
  
  const tree = new MerkleTree(TREE_LEVELS, leaves, {
    hashFunction: (a, b) => poseidonHash([a, b]),
    zeroElement: 0n
  });

  console.log(toBytes32(tree.root))

  // console.log(tree.proof(leaves[0]))
})();
