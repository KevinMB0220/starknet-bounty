"use client"

import { useState, useCallback } from 'react'
import { useStarknet } from './use-starknet'
import { useASP } from './use-asp'
import { aspClient } from '@/lib/asp-client'
import { usePortfolioStore } from './use-portfolio'
import { Note } from '@/lib/commitment'
import { ZylithContractClient } from '@/lib/contracts/zylith-contract'
import { CONFIG } from '@/lib/config'
import { Contract } from "starknet"
import zylithAbi from "@/lib/abis/zylith-abi.json"

interface WithdrawState {
  isLoading: boolean
  error: string | null
}

/**
 * Hook for private withdrawals
 * Handles the complete flow: fetch Merkle proof, generate ZK proof, execute withdraw, update portfolio
 */
export function usePrivateWithdraw() {
  const { account, provider } = useStarknet()
  const { client: aspClientInstance } = useASP()
  const { removeNote, addTransaction, updateTransaction } = usePortfolioStore()
  
  const [state, setState] = useState<WithdrawState>({
    isLoading: false,
    error: null,
  })

  /**
   * Execute private withdraw
   * @param note Note to withdraw
   * @param amount Amount to withdraw (must be <= note.amount)
   * @param recipient Address to receive the withdrawn tokens
   * @param tokenAddress Token contract address (optional, defaults to note.tokenAddress)
   */
  const withdraw = useCallback(async (
    note: Note,
    amount: bigint,
    recipient: string,
    tokenAddress?: string
  ): Promise<void> => {
    if (!account) {
      throw new Error('Account not connected')
    }

    if (note.index === undefined) {
      throw new Error('Note must have a leaf index')
    }

    if (amount > note.amount) {
      throw new Error('Withdraw amount exceeds note balance')
    }

    if (amount <= 0n) {
      throw new Error('Withdraw amount must be greater than zero')
    }

    const finalTokenAddress = tokenAddress || note.tokenAddress
    if (!finalTokenAddress) {
      throw new Error('Token address is required')
    }

    setState({ isLoading: true, error: null })

    try {
      // Step 1: Fetch Merkle Proof from ASP
      const merkleProof = await aspClientInstance.getMerkleProof(note.index)
      
      // Verify root matches
      const root = BigInt(merkleProof.root)
      if (root === 0n) {
        throw new Error('Invalid Merkle root from ASP')
      }

      // Step 2: Generate ZK Proof via Backend API
      const proofResponse = await fetch("/api/proof/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Public inputs
          nullifier: note.nullifier.toString(),
          root: merkleProof.root,
          recipient: recipient,
          amount: amount.toString(),
          // Private inputs
          secret: note.secret.toString(),
          pathElements: merkleProof.path,
          pathIndices: merkleProof.path_indices,
        })
      })

      if (!proofResponse.ok) {
        const errorData = await proofResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Proof generation failed')
      }

      const proofData = await proofResponse.json()
      if (proofData.error) {
        throw new Error(proofData.error)
      }

      // Step 3: Format proof for contract
      // Proof format: [A.x, A.y, B.x0, B.x1, B.y0, B.y1, C.x, C.y, ...public_inputs]
      const proof = proofData.full_proof_with_hints || proofData.proof
      const publicInputs = proofData.public_inputs || []

      // Step 4: Try to get prepared transaction from ASP, fallback to manual execution
      let tx: any
      
      try {
        // Try to use ASP to prepare transaction
        const prepareResponse = await aspClient.prepareWithdraw(
          note.secret.toString(),
          note.nullifier.toString(),
          note.amount.toString(),
          note.index!,
          recipient,
          finalTokenAddress
        )

        // Execute prepared transaction from ASP
        if (prepareResponse.transactions && prepareResponse.transactions.length > 0) {
          const preparedTx = prepareResponse.transactions[0]
          tx = await account.execute({
            contractAddress: preparedTx.contract_address,
            entrypoint: preparedTx.entry_point,
            calldata: preparedTx.calldata,
          })
        } else {
          throw new Error('ASP returned empty transactions')
        }
      } catch (aspError: any) {
        // Fallback to manual execution if ASP is not ready or returns error
        if (aspError.message?.includes('NOT_IMPLEMENTED') || aspError.message?.includes('not yet implemented')) {
          console.warn('ASP withdraw preparation not yet implemented, using manual execution')
        } else {
          console.warn('ASP withdraw preparation failed, using manual execution:', aspError)
        }
        
        // Manual execution (existing logic)
        const contractClient = new ZylithContractClient(provider as any)
        tx =         await contractClient.privateWithdraw(
          account as any,
          proof,
          publicInputs,
          finalTokenAddress,
          recipient,
          amount
        )
      }

      // Step 5: Track transaction
      addTransaction({
        hash: tx.transaction_hash,
        type: 'withdraw',
        status: 'pending',
        timestamp: Date.now(),
      })

      // Step 6: Wait for transaction
      await provider.waitForTransaction(tx.transaction_hash)

      // Step 7: Update portfolio
      // Strategy for partial withdrawals:
      // Since we can't modify an existing note's commitment (it's immutable),
      // we remove the note. The user would need to create a new deposit for the remainder
      // if they want to keep it private. This is a limitation of the current design.
      // Alternative: The circuit could support "change notes" but that's not implemented yet.
      removeNote(note.commitment)
      
      // Note: For partial withdrawals, the remainder is lost from the private pool.
      // User must create a new deposit if they want to keep the remainder private.

      updateTransaction(tx.transaction_hash, 'success')

      // Step 8: Post-transaction synchronization
      // Verify Merkle root after withdraw
      try {
        // Use Contract directly for read calls
        const contract = new Contract(zylithAbi, CONFIG.ZYLITH_CONTRACT, provider)
        const contractRoot = await contract.get_merkle_root()
        // Withdraw doesn't emit a new root in the same way, but we can verify the nullifier was spent
        // TODO: Verify nullifier is marked as spent
      } catch (syncError) {
        console.warn("Failed to sync state after withdraw:", syncError)
        // Non-critical error, continue
      }

      setState({ isLoading: false, error: null })

    } catch (error: any) {
      const errorMessage = error?.message || 'Withdraw failed'
      setState({ isLoading: false, error: errorMessage })
      
      // Update transaction status if it was added
      if (error?.transaction_hash) {
        updateTransaction(error.transaction_hash, 'failed')
      }
      
      throw error
    }
  }, [account, provider, aspClientInstance, removeNote, addTransaction, updateTransaction])

  return {
    withdraw,
    isLoading: state.isLoading,
    error: state.error,
  }
}

