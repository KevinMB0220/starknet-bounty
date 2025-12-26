#!/usr/bin/env python3
"""
Script para convertir proof de rapidsnark a formato Garaga para StarkNet
Con soporte para valores que exceden el límite de felt
"""
import json
import sys
from pathlib import Path

# StarkNet felt max (~252 bits)
STARKNET_FELT_MAX = 2**251 + 17 * 2**192 + 1
# BN254 field prime
BN254_PRIME = 21888242871839275222246405745257275088548364400416034343698204186575808495617

def apply_felt_modulo(value: int) -> int:
    """
    Aplica módulo felt252 a un valor BN254
    Esto es necesario porque valores BN254 pueden exceder felt252,
    pero Garaga espera valores felt252 (no u256)
    """
    if value < STARKNET_FELT_MAX:
        return value
    # Aplicar módulo felt252
    return value % STARKNET_FELT_MAX

def convert_proof_to_garaga(proof_file_path):
    """
    Convierte un proof de Groth16 generado por rapidsnark al formato Garaga
    """
    try:
        # Leer el archivo de proof
        with open(proof_file_path, 'r') as f:
            proof_data = json.load(f)
        
        # Validar que sea un proof Groth16
        if proof_data.get('protocol') != 'groth16':
            raise ValueError(f"Expected groth16 protocol, got {proof_data.get('protocol')}")
        
        # Extraer pi_a (punto G1) - array de números
        pi_a = proof_data['pi_a']
        a_x = int(pi_a[0]) if isinstance(pi_a[0], (int, str)) else int(pi_a[0])
        a_y = int(pi_a[1]) if isinstance(pi_a[1], (int, str)) else int(pi_a[1])
        
        # Extraer pi_b (punto G2) - array de arrays
        # Formato: [[x1, x0], [y1, y0]]
        pi_b = proof_data['pi_b']
        b_x0 = int(pi_b[0][1])  # x0 es el segundo elemento
        b_x1 = int(pi_b[0][0])  # x1 es el primer elemento
        b_y0 = int(pi_b[1][1])  # y0 es el segundo elemento
        b_y1 = int(pi_b[1][0])  # y1 es el primer elemento
        
        # Extraer pi_c (punto G1) - array de números
        pi_c = proof_data['pi_c']
        c_x = int(pi_c[0]) if isinstance(pi_c[0], (int, str)) else int(pi_c[0])
        c_y = int(pi_c[1]) if isinstance(pi_c[1], (int, str)) else int(pi_c[1])
        
        # Aplicar módulo felt252 a todos los valores para evitar overflow
        # Garaga espera valores felt252, no u256
        print("🔍 Applying felt252 modulo to proof values...", file=sys.stderr)
        a_x_mod = apply_felt_modulo(a_x)
        a_y_mod = apply_felt_modulo(a_y)
        b_x0_mod = apply_felt_modulo(b_x0)
        b_x1_mod = apply_felt_modulo(b_x1)
        b_y0_mod = apply_felt_modulo(b_y0)
        b_y1_mod = apply_felt_modulo(b_y1)
        c_x_mod = apply_felt_modulo(c_x)
        c_y_mod = apply_felt_modulo(c_y)
        
        # Log si hubo overflow
        values_original = {
            'a.x': a_x, 'a.y': a_y,
            'b.x0': b_x0, 'b.x1': b_x1,
            'b.y0': b_y0, 'b.y1': b_y1,
            'c.x': c_x, 'c.y': c_y
        }
        values_mod = {
            'a.x': a_x_mod, 'a.y': a_y_mod,
            'b.x0': b_x0_mod, 'b.x1': b_x1_mod,
            'b.y0': b_y0_mod, 'b.y1': b_y1_mod,
            'c.x': c_x_mod, 'c.y': c_y_mod
        }
        
        for name in values_original.keys():
            orig = values_original[name]
            mod = values_mod[name]
            if orig != mod:
                print(f"  ⚠️  {name}: applied modulo (original: {orig}, modulo: {mod})", file=sys.stderr)
            else:
                print(f"  ✅ {name}: OK", file=sys.stderr)
        
        # Crear el formato Garaga con valores módulo
        garaga_proof = {
            "a": {
                "x": hex(a_x_mod),
                "y": hex(a_y_mod)
            },
            "b": {
                "x": [hex(b_x0_mod), hex(b_x1_mod)],
                "y": [hex(b_y0_mod), hex(b_y1_mod)]
            },
            "c": {
                "x": hex(c_x_mod),
                "y": hex(c_y_mod)
            }
        }
        
        return garaga_proof
        
    except KeyError as e:
        raise ValueError(f"Missing required field in proof: {e}")
    except Exception as e:
        raise ValueError(f"Failed to convert proof: {str(e)}")


def proof_to_calldata(garaga_proof):
    """
    Convierte proof a calldata (valores ya están en formato felt252 con módulo aplicado)
    """
    try:
        a_x = int(garaga_proof['a']['x'], 16)
        a_y = int(garaga_proof['a']['y'], 16)
        
        b_x0 = int(garaga_proof['b']['x'][0], 16)
        b_x1 = int(garaga_proof['b']['x'][1], 16)
        b_y0 = int(garaga_proof['b']['y'][0], 16)
        b_y1 = int(garaga_proof['b']['y'][1], 16)
        
        c_x = int(garaga_proof['c']['x'], 16)
        c_y = int(garaga_proof['c']['y'], 16)
        
        calldata = [
            str(a_x), str(a_y),
            str(b_x0), str(b_x1),
            str(b_y0), str(b_y1),
            str(c_x), str(c_y)
        ]
        
        return calldata
        
    except Exception as e:
        raise ValueError(f"Failed to generate calldata: {str(e)}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_garaga.py <proof_file.json>", file=sys.stderr)
        sys.exit(1)
    
    proof_file = sys.argv[1]
    
    if not Path(proof_file).exists():
        print(f"Error: File not found: {proof_file}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Convertir proof a formato Garaga
        garaga_proof = convert_proof_to_garaga(proof_file)
        
        # Guardar proof en formato Garaga (opcional, para debugging)
        garaga_file = proof_file.replace('.json', '_garaga.json')
        with open(garaga_file, 'w') as f:
            json.dump(garaga_proof, f, indent=2)
        
        print(f"✅ Garaga proof saved to: {garaga_file}", file=sys.stderr)
        
        # Generar calldata (valores ya tienen módulo felt252 aplicado)
        print("📊 Generating calldata (values already have felt252 modulo applied)", file=sys.stderr)
        calldata = proof_to_calldata(garaga_proof)
        
        # Imprimir calldata como JSON para que Rust pueda parsearlo
        # IMPORTANTE: Esto va a stdout para que Rust lo pueda leer
        print(json.dumps(calldata))
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    sys.exit(main())

