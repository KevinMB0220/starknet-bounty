
        // Nota: NODE_OPTIONS se pasa como variable de entorno desde Rust
        // para que Node.js lo lea al iniciar (no funciona si se establece aquí)
        const snarkjs = require('snarkjs');
        const fs = require('fs');
        const path = require('path');
        
        (async () => {
            try {
                const input = JSON.parse(fs.readFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_input_1766694501482518000.json', 'utf8'));
                const wasmPath = path.resolve('/Users/kevinbrenes/starknet-bounty/circuits/out/swap_js/swap.wasm');
                const zkeyPath = path.resolve('/Users/kevinbrenes/starknet-bounty/circuits/out/swap_final.zkey');
                
                console.log('Starting proof generation...');
                console.log('WASM:', wasmPath);
                console.log('ZKey:', zkeyPath);
                console.log('Node.js memory limit:', process.env.NODE_OPTIONS || 'default');
                
                const startTime = Date.now();
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                    input,
                    wasmPath,
                    zkeyPath
                );
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log('Proof generated successfully in', elapsed, 'seconds');
                
                fs.writeFileSync('/var/folders/nt/mhkztv4n6zj3v9_ts7jf_pr00000gn/T/swap_proof_1766694501482518000.json', JSON.stringify({
                    proof: proof,
                    publicSignals: publicSignals
                }, null, 2));
            } catch (error) {
                console.error('Error:', error.message);
                console.error('Stack:', error.stack);
                process.exit(1);
            }
        })();
        