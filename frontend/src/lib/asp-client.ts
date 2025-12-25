import { CONFIG } from "@/lib/config";
import type {
  MerkleProof,
  TreeInfo,
  PreparedTransaction,
  DepositPrepareResponse,
  SwapPrepareResponse,
  WithdrawPrepareResponse,
  LiquidityPrepareResponse,
  InitializePrepareResponse,
} from "@/types/api-types";

export class ASPClient {
  private baseUrl: string;

  // Use direct ASP URL for transaction preparation endpoints
  // Use local API proxy for Merkle proofs to avoid CORS
  constructor(baseUrl: string = "/api/merkle") {
    this.baseUrl = baseUrl;
  }

  private getAspUrl(): string {
    // For transaction preparation, use direct ASP URL
    return CONFIG.ASP_SERVER_URL;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit, useDirectUrl = false): Promise<T> {
    const baseUrl = useDirectUrl ? this.getAspUrl() : this.baseUrl;
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`ASP API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  }

  // Merkle proof methods (use proxy)
  async getMerkleProof(index: number): Promise<MerkleProof> {
    return this.fetch<MerkleProof>(`/deposit/proof/${index}`);
  }

  async getCurrentRoot(): Promise<string> {
    return this.fetch<string>(`/deposit/root`);
  }

  async getTreeInfo(): Promise<TreeInfo> {
    return this.fetch<TreeInfo>(`/deposit/info`);
  }

  async getHealth(): Promise<{ status: string }> {
    return this.fetch<{ status: string }>(`/health`);
  }

  async isPoolInitialized(): Promise<{ initialized: boolean }> {
    return this.fetch<{ initialized: boolean }>(
      "/api/pool/initialized",
      {
        method: "GET",
      },
      true // Use direct ASP URL
    );
  }

  // Transaction preparation methods (use direct ASP URL)
  async prepareDeposit(
    amount: string,
    tokenAddress: string,
    userAddress: string
  ): Promise<DepositPrepareResponse> {
    return this.fetch<DepositPrepareResponse>(
      "/api/deposit/prepare",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          token_address: tokenAddress,
          user_address: userAddress,
        }),
      },
      true // Use direct ASP URL
    );
  }

  async prepareSwap(
    secret: string,
    nullifier: string,
    amount: string,
    noteIndex: number,
    amountSpecified: string,
    zeroForOne: boolean,
    sqrtPriceLimit?: { low: string; high: string },
    newSecret?: string,
    newNullifier?: string,
    newAmount?: string
  ): Promise<SwapPrepareResponse> {
    return this.fetch<SwapPrepareResponse>(
      "/api/swap/prepare",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          nullifier,
          amount,
          note_index: noteIndex,
          amount_specified: amountSpecified,
          zero_for_one: zeroForOne,
          sqrt_price_limit: sqrtPriceLimit ? `${sqrtPriceLimit.low},${sqrtPriceLimit.high}` : undefined,
          new_secret: newSecret,
          new_nullifier: newNullifier,
          new_amount: newAmount,
        }),
      },
      true
    );
  }

  async prepareWithdraw(
    secret: string,
    nullifier: string,
    amount: string,
    noteIndex: number,
    recipient: string,
    tokenAddress?: string
  ): Promise<WithdrawPrepareResponse> {
    return this.fetch<WithdrawPrepareResponse>(
      "/api/withdraw/prepare",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          nullifier,
          amount,
          note_index: noteIndex,
          recipient,
          token_address: tokenAddress,
        }),
      },
      true
    );
  }

  async prepareMintLiquidity(
    secret: string,
    nullifier: string,
    amount: string,
    noteIndex: number,
    tickLower: number,
    tickUpper: number,
    liquidity: string,
    newSecret?: string,
    newNullifier?: string,
    newAmount?: string
  ): Promise<LiquidityPrepareResponse> {
    return this.fetch<LiquidityPrepareResponse>(
      "/api/liquidity/mint/prepare",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          nullifier,
          amount,
          note_index: noteIndex,
          tick_lower: tickLower,
          tick_upper: tickUpper,
          liquidity,
          new_secret: newSecret,
          new_nullifier: newNullifier,
          new_amount: newAmount,
        }),
      },
      true
    );
  }

  async prepareBurnLiquidity(
    secret: string,
    nullifier: string,
    amount: string,
    noteIndex: number,
    tickLower: number,
    tickUpper: number,
    liquidity: string,
    newSecret?: string,
    newNullifier?: string,
    newAmount?: string
  ): Promise<LiquidityPrepareResponse> {
    return this.fetch<LiquidityPrepareResponse>(
      "/api/liquidity/burn/prepare",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          nullifier,
          amount,
          note_index: noteIndex,
          tick_lower: tickLower,
          tick_upper: tickUpper,
          liquidity,
          new_secret: newSecret,
          new_nullifier: newNullifier,
          new_amount: newAmount,
        }),
      },
      true
    );
  }

  async prepareInitialize(
    token0?: string,
    token1?: string,
    fee?: number,
    tickSpacing?: number,
    sqrtPriceX128?: string
  ): Promise<InitializePrepareResponse> {
    return this.fetch<InitializePrepareResponse>(
      "/api/initialize/prepare",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token0,
          token1,
          fee,
          tick_spacing: tickSpacing,
          sqrt_price_x128: sqrtPriceX128,
        }),
      },
      true
    );
  }
}

export const aspClient = new ASPClient();
