include "../node_modules/circomlib/circuits/poseidon.circom";

template MerkleTreeInclusionProof(levels) {
  signal input leaf;
  signal input pathElements[levels];
  signal input pathIndices[levels];
  signal output root;

  signal intermediates[levels + 1];
  intermediates[0] <== leaf;

  component hashes[levels];
  component selectorsLeft[levels];
  component selectorsRight[levels];

  for (var i = 0; i < levels; i++) {
    hashes[i] = Poseidon(2);

    selectorsLeft[i] = Selector();
    selectorsRight[i] = Selector();

    selectorsLeft[i].in[0] <== intermediates[i];
    selectorsLeft[i].in[1] <== pathElements[i];
    selectorsLeft[i].sel <== pathIndices[i];

    selectorsRight[i].in[0] <== pathElements[i];
    selectorsRight[i].in[1] <== intermediates[i];
    selectorsRight[i].sel <== pathIndices[i];

    hashes[i].inputs[0] <== selectorsLeft[i].out;
    hashes[i].inputs[1] <== selectorsRight[i].out;

    intermediates[i + 1] <== hashes[i].out;
  }

  root <== intermediates[levels];
}