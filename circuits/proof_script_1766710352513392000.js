
            const snarkjs = require('snarkjs');
            const fs = require('fs');
            
            (async () => {
                try {
                    console.log('Generating proof...');
                    const startTime = Date.now();
                    
                    const { proof, publicSignals } = await snarkjs.groth16.prove(
                        '/Users/kevinbrenes/starknet-bounty/circuits/out/swap_final.zkey',
                        '/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_witness_1766710352513392000.wtns'
                    );
                    
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                    console.log('Proof generated in', elapsed, 'seconds');
                    
                    fs.writeFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_proof_1766710352513392000.json', JSON.stringify(proof, null, 2));
                    fs.writeFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_public_1766710352513392000.json', JSON.stringify(publicSignals, null, 2));
                } catch (error) {
                    console.error('Error:', error.message);
                    process.exit(1);
                }
            })();
            