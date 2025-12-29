import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/commitment/position
 * Generate position commitment for LP operations using BN254 Poseidon
 * position_commitment = Mask(Poseidon(secret, tick_lower + tick_upper))
 * This matches the circuit's calculation in lp.circom line 123-131
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, tickSum } = body;

    if (!secret || tickSum === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: secret, tickSum" },
        { status: 400 }
      );
    }

    // Use circomlibjs for BN254 Poseidon (same as circuit)
    const { buildPoseidon } = await import("circomlibjs");
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Mask to 250 bits (matches Cairo Mask250)
    const MASK_250 = (1n << 250n) - 1n;
    const mask250 = (value: bigint) => value & MASK_250;

    // Parse inputs
    const secretBigInt = BigInt(secret);
    const tickSumBigInt = BigInt(tickSum);

    // position_commitment = Mask(Poseidon(secret, tick_lower + tick_upper))
    // tickSum = tick_lower + tick_upper (calculated in frontend)
    const hash = poseidon([secretBigInt, tickSumBigInt]);
    const hashBigInt = F.toObject(hash);
    const commitment = mask250(hashBigInt);

    return NextResponse.json({ commitment: commitment.toString() });
  } catch (error) {
    console.error("Position commitment generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

