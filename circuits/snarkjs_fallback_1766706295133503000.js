
            const snarkjs = require('snarkjs');
            const fs = require('fs');
            
            (async () => {
                const input = JSON.parse(fs.readFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_input_1766706295133503000.json', 'utf8'));
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                    input,
                    '/Users/kevinbrenes/starknet-bounty/circuits/out/swap_js/swap.wasm',
                    '/Users/kevinbrenes/starknet-bounty/circuits/out/swap_final.zkey'
                );
                fs.writeFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_proof_1766706295133503000.json', JSON.stringify(proof, null, 2));
                fs.writeFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_public_1766706295133503000.json', JSON.stringify(publicSignals, null, 2));
            })();
            