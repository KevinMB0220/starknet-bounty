/**
 * Note Validation Utilities
 * Validates notes against the Merkle tree to ensure they can be used for ZK operations
 */

import { Note } from "./commitment"
import { generateCommitment, computeLegacyCommitment } from "./commitment"
import { aspClient } from "./asp-client"

export interface NoteValidationResult {
  isValid: boolean
  isLegacy: boolean
  reason?: string
  treeCommitment?: bigint
  calculatedCommitment?: bigint
  legacyCommitment?: bigint
}

/**
 * Validate a note against the Merkle tree
 * This checks if the note's commitment matches what the circuit will calculate
 * 
 * @param note - The note to validate
 * @returns Validation result with details
 */
export async function validateNote(note: Note): Promise<NoteValidationResult> {
  // Notes without index cannot be validated (not yet in tree)
  if (note.index === undefined) {
    return {
      isValid: false,
      isLegacy: false,
      reason: "Note does not have a leaf index yet",
    }
  }

  try {
    // Fetch Merkle proof to get the commitment from the tree
    const merkleProof = await aspClient.getMerkleProof(note.index)
    const proofLeaf = BigInt(merkleProof.leaf)

    console.log("[NoteValidation] 🔍 Validating note:", {
      index: note.index,
      storedCommitment: note.commitment.toString(),
      treeCommitment: proofLeaf.toString(),
      amount: note.amount.toString(),
    })

    // Calculate commitment using current method (BN254 Poseidon)
    const cairoCommitment = await generateCommitment(note.secret, note.nullifier, note.amount)
    
    // Calculate legacy commitment for comparison
    const legacyCommitment = computeLegacyCommitment(note.secret, note.nullifier, note.amount)

    console.log("[NoteValidation] 📊 Calculated commitments:", {
      cairo: cairoCommitment.toString(),
      legacy: legacyCommitment.toString(),
      tree: proofLeaf.toString(),
      cairoMatches: proofLeaf === cairoCommitment,
      legacyMatches: proofLeaf === legacyCommitment,
    })

    // Check if tree commitment matches current method
    if (proofLeaf === cairoCommitment) {
      console.log("[NoteValidation] ✅ Note is valid (BN254)")
      return {
        isValid: true,
        isLegacy: false,
        treeCommitment: proofLeaf,
        calculatedCommitment: cairoCommitment,
      }
    }

    // Check if tree commitment matches legacy method
    if (proofLeaf === legacyCommitment) {
      console.log("[NoteValidation] ⚠️ Note is legacy (Starknet Poseidon)")
      return {
        isValid: false,
        isLegacy: true,
        reason: "Legacy note: deposited before Poseidon fix. Withdraw and re-deposit to use.",
        treeCommitment: proofLeaf,
        calculatedCommitment: cairoCommitment,
        legacyCommitment: legacyCommitment,
      }
    }

    // Tree commitment doesn't match either method
    console.error("[NoteValidation] ❌ Note data mismatch:", {
      treeCommitment: proofLeaf.toString(),
      cairoCommitment: cairoCommitment.toString(),
      legacyCommitment: legacyCommitment.toString(),
      noteSecret: note.secret.toString().substring(0, 20) + "...",
      noteNullifier: note.nullifier.toString().substring(0, 20) + "...",
      noteAmount: note.amount.toString(),
    })
    
    return {
      isValid: false,
      isLegacy: false,
      reason: "Note data mismatch: secret/nullifier/amount don't match the commitment in the tree",
      treeCommitment: proofLeaf,
      calculatedCommitment: cairoCommitment,
      legacyCommitment: legacyCommitment,
    }
  } catch (error: any) {
    console.error("[NoteValidation] ❌ Validation error:", error)
    return {
      isValid: false,
      isLegacy: false,
      reason: `Validation failed: ${error.message || "Unknown error"}`,
    }
  }
}

/**
 * Validate multiple notes and return only valid ones
 * 
 * @param notes - Array of notes to validate
 * @returns Array of valid notes
 */
export async function filterValidNotes(notes: Note[]): Promise<Note[]> {
  const validationPromises = notes.map(note => validateNote(note))
  const results = await Promise.all(validationPromises)
  
  return notes.filter((_, index) => results[index].isValid)
}

/**
 * Check if a note is valid without fetching Merkle proof (fast check)
 * This only checks if the note has required fields
 * 
 * @param note - The note to check
 * @returns True if note has basic required fields
 */
export function isNoteBasicValid(note: Note): boolean {
  return (
    note.secret !== undefined &&
    note.nullifier !== undefined &&
    note.amount !== undefined &&
    note.commitment !== undefined &&
    note.index !== undefined
  )
}

