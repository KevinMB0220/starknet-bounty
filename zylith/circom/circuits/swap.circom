// Private Swap Circuit for Zylith
// Proves valid swap: commitment_in -> swap -> commitment_out

pragma circom 2.1.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "./lib/merkleTree.circom";

template Swap(depth) {
    // Public inputs
    signal input root;
    signal input commitment_in;
    signal input commitment_out;
    signal input amount_in;
    signal input amount_out;
    
    // Private inputs
    signal input secret_in;
    signal input nullifier_in;
    signal input secret_out;
    signal input nullifier_out;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    
    // Verify input commitment
    component poseidon1 = Poseidon(2);
    poseidon1.inputs[0] <== secret_in;
    poseidon1.inputs[1] <== nullifier_in;
    
    component poseidon2 = Poseidon(2);
    poseidon2.inputs[0] <== poseidon1.out;
    poseidon2.inputs[1] <== amount_in;
    poseidon2.out === commitment_in;
    
    // Verify output commitment
    component poseidon3 = Poseidon(2);
    poseidon3.inputs[0] <== secret_out;
    poseidon3.inputs[1] <== nullifier_out;
    
    component poseidon4 = Poseidon(2);
    poseidon4.inputs[0] <== poseidon3.out;
    poseidon4.inputs[1] <== amount_out;
    poseidon4.out === commitment_out;
    
    // Verify Merkle membership of input commitment
    component merkleTree = MerkleTreeChecker(depth);
    merkleTree.leaf <== commitment_in;
    merkleTree.root <== root;
    
    for (var i = 0; i < depth; i++) {
        merkleTree.pathElements[i] <== pathElements[i];
        merkleTree.pathIndices[i] <== pathIndices[i];
    }
    
    // Verify swap amounts: amount_out <= amount_in
    // Method: Compute difference and ensure it's representable as positive number
    signal amount_diff;
    amount_diff <== amount_in - amount_out;
    
    // Constrain amount_diff to be non-negative by converting to bits
    // If it can be represented in 252 bits without overflow, it's positive
    component n2b = Num2Bits(252);
    n2b.in <== amount_diff;
}

component main {public [root, commitment_in, commitment_out, amount_in, amount_out]} = Swap(20);