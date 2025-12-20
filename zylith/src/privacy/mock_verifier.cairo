// Mock Verifier for testing ZK integration
// Implements the same interface as Garaga-generated verifiers

#[starknet::interface]
pub trait IMockVerifier<TContractState> {
    fn verify_groth16_proof_bn254(
        self: @TContractState, full_proof_with_hints: Span<felt252>,
    ) -> Result<Span<u256>, felt252>;
}

#[starknet::contract]
pub mod MockVerifier {
    use core::array::ArrayTrait;

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl MockVerifierImpl of super::IMockVerifier<ContractState> {
        fn verify_groth16_proof_bn254(
            self: @ContractState, full_proof_with_hints: Span<felt252>,
        ) -> Result<Span<u256>, felt252> {
            let mut result_arr = ArrayTrait::new();
            let mut i = 0;
            while i < full_proof_with_hints.len() {
                let val_felt = *full_proof_with_hints.at(i);
                result_arr.append(val_felt.into());
                i += 1;
            }

            Result::Ok(result_arr.span())
        }
    }
}
