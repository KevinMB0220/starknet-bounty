
            const snarkjs = require('snarkjs');
            const fs = require('fs');
            
            (async () => {
                try {
                    const input = JSON.parse(fs.readFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_input_1766705227704344000.json', 'utf8'));
                    const wasmPath = '/Users/kevinbrenes/starknet-bounty/circuits/out/swap_js/swap.wasm';
                    const zkeyPath = '/Users/kevinbrenes/starknet-bounty/circuits/out/swap_final.zkey';
                    
                    console.log('Generating proof with snarkjs (fallback)...');
                    const startTime = Date.now();
                    
                    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                        input,
                        wasmPath,
                        zkeyPath
                    );
                    
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                    console.log('Proof generated in', elapsed, 'seconds');
                    
                    fs.writeFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_proof_normalized_1766705227704344000.json', JSON.stringify(proof, null, 2));
                    fs.writeFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_public_1766705227704344000.json', JSON.stringify(publicSignals, null, 2));
                } catch (error) {
                    console.error('Error:', error.message);
                    process.exit(1);
                }
            })();
            