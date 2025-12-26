"use client"

import { Button } from "@/components/ui/button"
import { useInitializePool } from "@/hooks/use-initialize-pool"
import { useAccount } from "@starknet-react/core"
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { aspClient } from "@/lib/asp-client"
import { useEffect, useState } from "react"

export function InitializePoolButton() {
  const { account } = useAccount()
  const { initialize, isInitializing } = useInitializePool()
  const [isPoolInitialized, setIsPoolInitialized] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkInitialized = async () => {
      try {
        const response = await aspClient.isPoolInitialized()
        setIsPoolInitialized(response.initialized)
      } catch (error) {
        console.error("Failed to check pool status:", error)
        setIsPoolInitialized(false)
      } finally {
        setChecking(false)
      }
    }
    checkInitialized()
  }, [])

  if (!account) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Wallet not connected</AlertTitle>
        <AlertDescription>
          Please connect your wallet to initialize the pool.
        </AlertDescription>
      </Alert>
    )
  }

  if (checking) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking pool status...</AlertTitle>
      </Alert>
    )
  }

  if (isPoolInitialized) {
    return (
      <Alert className="border-green-500">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-400">Pool Already Initialized</AlertTitle>
        <AlertDescription>
          The pool has already been initialized. You can now make deposits, swaps, and add liquidity.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Pool Initialization</AlertTitle>
        <AlertDescription>
          Initialize the pool with ETH/USDC at a 1:1 price ratio. This can only be done once.
        </AlertDescription>
      </Alert>

      <Button
        onClick={initialize}
        disabled={isInitializing}
        className="w-full"
        size="lg"
      >
        {isInitializing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing Pool...
          </>
        ) : (
          "Initialize Pool"
        )}
      </Button>

      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Token0:</strong> ETH (0x049d...dc7)</p>
        <p><strong>Token1:</strong> USDC (0x053c...8a8)</p>
        <p><strong>Fee:</strong> 0.3% (3000)</p>
        <p><strong>Tick Spacing:</strong> 60</p>
        <p><strong>Initial Price:</strong> 1:1 (Q128)</p>
      </div>
    </div>
  )
}

