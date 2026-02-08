pragma circom 2.1.6;

include "./selector.circom";
include "./merkleTreeInclusionProof.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template Withdraw(N) {
  signal input root;
  signal input nullifier;

  signal input secret[2];
  signal input loanAmount;
  signal input pathElements[N];
  signal input pathIndices[N];
  signal output publicLoanAmount;

  component commitmentHash = Poseidon(3);
  commitmentHash.inputs[0] <== secret[0];
  commitmentHash.inputs[1] <== secret[1];
  commitmentHash.inputs[2] <== loanAmount;

  nullifier === commitmentHash.out;

  component merkle = MerkleTreeInclusionProof(N);
  merkle.leaf <== commitmentHash.out;

  for (var i = 0; i < N; i++) {
    merkle.pathElements[i] <== pathElements[i];
    merkle.pathIndices[i] <== pathIndices[i];
  }

  root === merkle.root;

  publicLoanAmount <== loanAmount;
}

component main = Withdraw(2);
