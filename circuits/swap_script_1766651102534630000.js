
        const snarkjs = require('snarkjs');
        const fs = require('fs');
        const path = require('path');
        
        (async () => {
            try {
                const input = JSON.parse(fs.readFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_input_1766651102534025000.json', 'utf8'));
                const wasmPath = path.resolve('/Users/kevinbrenes/starknet-bounty/circuits/out/swap_js/swap.wasm');
                const zkeyPath = path.resolve('/Users/kevinbrenes/starknet-bounty/circuits/out/swap_final.zkey');
                
                console.log('Starting proof generation...');
                console.log('WASM:', wasmPath);
                console.log('ZKey:', zkeyPath);
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                    input,
                    wasmPath,
                    zkeyPath
                );
                
                fs.writeFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_proof_1766651102534026000.json', JSON.stringify({
                    proof: proof,
                    publicSignals: publicSignals
                }, null, 2));
                console.log('Proof generated successfully');
            } catch (error) {
                console.error('Error:', error.message);
                console.error('Stack:', error.stack);
                process.exit(1);
            }
        })();
        