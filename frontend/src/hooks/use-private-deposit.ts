"use client"

import { useState, useCallback } from 'react'
import { useStarknet } from './use-starknet'
import { usePortfolioStore } from './use-portfolio'
import { Note } from '@/lib/commitment'
import { CONFIG } from '@/lib/config'
import { aspClient } from '@/lib/asp-client'
import { Contract } from 'starknet'
import zylithAbi from '@/lib/abis/zylith-abi.json'

interface DepositState {
  isLoading: boolean
  error: string | null
}

/**
 * Hook for private deposits
 * Uses ASP to prepare transactions, then executes them with user's wallet
 */
export function usePrivateDeposit() {
  const { account, provider } = useStarknet()
  const { addNote, addTransaction, updateTransaction } = usePortfolioStore()
  
  const [state, setState] = useState<DepositState>({
    isLoading: false,
    error: null,
  })

  /**
   * Execute private deposit
   * @param tokenAddress Token contract address
   * @param amount Amount to deposit (in token's smallest unit)
   */
  const deposit = useCallback(async (
    tokenAddress: string,
    amount: bigint
  ): Promise<Note> => {
    if (!account) {
      throw new Error('Account not connected')
    }

    if (!account.address) {
      throw new Error('Account address not available')
    }

    setState({ isLoading: true, error: null })

    try {
      // Step 1: Get prepared transactions from ASP
      // ASP generates note, commitment, and prepares approve + deposit transactions
      const prepareResponse = await aspClient.prepareDeposit(
        amount.toString(),
        tokenAddress,
        account.address
      )

      // Step 2: Execute each prepared transaction
      const transactionHashes: string[] = []

      for (const tx of prepareResponse.transactions) {
        // Execute transaction using account.execute()
        const result = await account.execute({
          contractAddress: tx.contract_address,
          entrypoint: tx.entry_point,
          calldata: tx.calldata,
        })

        transactionHashes.push(result.transaction_hash)

        // Add transaction to portfolio
        // Note: We only track the deposit transaction, approve is internal
        if (tx.entry_point === 'private_deposit') {
          addTransaction({
            hash: result.transaction_hash,
            type: 'deposit',
            status: 'pending',
            timestamp: Date.now(),
          })
        }

        // Wait for transaction to be accepted (with timeout)
        // Use a shorter timeout to avoid hanging too long
        try {
          await Promise.race([
            provider.waitForTransaction(result.transaction_hash),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Transaction timeout')), 60000) // 60 second timeout
            )
          ])
        } catch (timeoutError) {
          console.warn(`Transaction ${result.transaction_hash} timeout, but continuing...`)
          // Continue even if timeout - transaction may still be processing
        }
      }

      // Step 3: Extract leaf_index from Deposit event
      // Get the deposit transaction receipt (last one)
      const depositTxHash = transactionHashes[transactionHashes.length - 1]
      const receipt = await provider.getTransactionReceipt(depositTxHash)
      
      const DEPOSIT_EVENT_SELECTOR = '0x9149d2123147c5f43d258257fef0b7b969db78269369ebcf5ebb9eef8592f2'
      
      let leafIndex: number | undefined
      
      // Check if receipt has events (type guard)
      if (receipt && 'events' in receipt && receipt.events) {
        const depositEvent = receipt.events.find((event: any) => {
          const isFromZylith = event.from_address?.toLowerCase() === CONFIG.ZYLITH_CONTRACT.toLowerCase()
          const hasDepositSelector = event.keys && event.keys[0] === DEPOSIT_EVENT_SELECTOR
          return isFromZylith && hasDepositSelector
        })

        if (depositEvent && depositEvent.data && depositEvent.data.length >= 3) {
          // Deposit event structure: [commitment, leaf_index, root]
          const eventCommitment = BigInt(depositEvent.data[0])
          const expectedCommitment = BigInt(prepareResponse.commitment)
          
          // Verify commitment matches
          if (eventCommitment === expectedCommitment) {
            leafIndex = Number(depositEvent.data[1])
          }
        }
      }

      // Fallback: If leaf index not found in events, log warning
      if (leafIndex === undefined) {
        console.warn('Leaf index not found in deposit event. ASP may need time to sync.')
      }

      // Step 4: Create note from ASP response and save to portfolio
      const note: Note = {
        secret: BigInt(prepareResponse.note_data.secret),
        nullifier: BigInt(prepareResponse.note_data.nullifier),
        amount: BigInt(prepareResponse.note_data.amount),
        commitment: BigInt(prepareResponse.commitment),
        tokenAddress,
        index: leafIndex,
      }

      addNote(note)
      
      // Update transaction statuses
      transactionHashes.forEach(hash => {
        updateTransaction(hash, 'success')
      })

      // Step 5: Post-transaction synchronization (optional verification)
      try {
        // Use Contract directly for read calls
        const contract = new Contract(zylithAbi, CONFIG.ZYLITH_CONTRACT, provider)
        const contractRoot = await contract.get_merkle_root()
        
        if (receipt && 'events' in receipt && receipt.events) {
          const eventRoot = receipt.events.find((e: any) => 
            e.keys?.[0] === DEPOSIT_EVENT_SELECTOR
          )?.data?.[2]
          
          if (eventRoot && BigInt(eventRoot) !== BigInt(contractRoot.toString())) {
            console.warn("Merkle root mismatch after deposit. Event root:", eventRoot, "Contract root:", contractRoot.toString())
          }
        }
      } catch (syncError) {
        console.warn("Failed to sync Merkle root after deposit:", syncError)
        // Non-critical error, continue
      }

      setState({ isLoading: false, error: null })
      return note

    } catch (error: any) {
      const errorMessage = error?.message || 'Deposit failed'
      setState({ isLoading: false, error: errorMessage })
      
      // Update transaction status if it was added
      if (error?.transaction_hash) {
        updateTransaction(error.transaction_hash, 'failed')
      }
      
      throw error
    }
  }, [account, provider, addNote, addTransaction, updateTransaction])

  return {
    deposit,
    isLoading: state.isLoading,
    error: state.error,
  }
}

