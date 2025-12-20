// Liquidity Management - Calculate and update liquidity
// Based on Uniswap v3 / Ekubo formulas

/// Calculate liquidity for a given range (token0)
/// Formula: L = amount0 * (sqrt(P_b) * sqrt(P_a)) / (sqrt(P_b) - sqrt(P_a))
pub fn get_liquidity_for_amount0(
    sqrt_price_a_x128: u256, sqrt_price_b_x128: u256, amount0: u128,
) -> u128 {
    let (price_lower, price_upper) = if sqrt_price_a_x128 < sqrt_price_b_x128 {
        (sqrt_price_a_x128, sqrt_price_b_x128)
    } else {
        (sqrt_price_b_x128, sqrt_price_a_x128)
    };
    assert!(price_lower < price_upper, "Invalid price range");

    let sqrt_price_diff = price_upper - price_lower;
    let amount0_u256: u256 = amount0.into();

    // To avoid (P_upper * P_lower) overflow (which happens at Q128 if P > 1)
    // we use a reordered formula: L = amount0 * (P_upper/2^64 * P_lower/2^64) / (diff)
    // and then adjust for the missing 2^128 (Q128)
    let q64: u256 = 18446744073709551616; // 2^64
    let p_upper_q64 = price_upper / q64;
    let p_lower_q64 = price_lower / q64;

    let intermediate = (amount0_u256 * p_upper_q64 * p_lower_q64);
    let result = intermediate / sqrt_price_diff;

    result.try_into().unwrap()
}

/// Calculate liquidity for a given range (token1)
/// Formula: L = amount1 / (sqrt(P_b) - sqrt(P_a))
pub fn get_liquidity_for_amount1(
    sqrt_price_a_x128: u256, sqrt_price_b_x128: u256, amount1: u128,
) -> u128 {
    let (price_lower, price_upper) = if sqrt_price_a_x128 < sqrt_price_b_x128 {
        (sqrt_price_a_x128, sqrt_price_b_x128)
    } else {
        (sqrt_price_b_x128, sqrt_price_a_x128)
    };
    assert!(price_lower < price_upper, "Invalid price range");

    let sqrt_price_diff = price_upper - price_lower;
    let amount1_u256: u256 = amount1.into();
    let q128_u256: u256 = 340282366920938463463374607431768211456; // 2^128

    // result = (amount1 * 2^128) / sqrt_price_diff
    // This can still overflow if amount1 is large.
    // Use intermediate check or split
    let result = if amount1_u256 > 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF {
        // If amount1 > 2^128, do division first (loses precision but prevents crash)
        (amount1_u256 / sqrt_price_diff) * q128_u256
    } else {
        (amount1_u256 * q128_u256) / sqrt_price_diff
    };

    result.try_into().unwrap()
}

/// Calculate amount0 from liquidity
pub fn get_amount0_for_liquidity(
    sqrt_price_a_x128: u256, sqrt_price_b_x128: u256, liquidity: u128,
) -> u128 {
    let (price_lower, price_upper) = if sqrt_price_a_x128 < sqrt_price_b_x128 {
        (sqrt_price_a_x128, sqrt_price_b_x128)
    } else {
        (sqrt_price_b_x128, sqrt_price_a_x128)
    };
    assert!(price_lower < price_upper, "Invalid price range");

    let sqrt_price_diff = price_upper - price_lower;
    let liquidity_u256: u256 = liquidity.into();
    let q64: u256 = 18446744073709551616; // 2^64

    // amount0 = L * (P_upper - P_lower) * Q128 / (P_upper * P_lower)
    // To avoid denominator overflow: (P_upper/2^64 * P_lower/2^64)
    let denominator = (price_upper / q64) * (price_lower / q64);
    assert!(denominator > 0, "Denominator overflow/underflow");

    let numerator = liquidity_u256 * sqrt_price_diff;
    let result_u256 = numerator / denominator;
    result_u256.try_into().unwrap()
}

/// Calculate amount1 from liquidity
pub fn get_amount1_for_liquidity(
    sqrt_price_a_x128: u256, sqrt_price_b_x128: u256, liquidity: u128,
) -> u128 {
    let (price_lower, price_upper) = if sqrt_price_a_x128 < sqrt_price_b_x128 {
        (sqrt_price_a_x128, sqrt_price_b_x128)
    } else {
        (sqrt_price_b_x128, sqrt_price_a_x128)
    };
    if price_lower >= price_upper {
        return 0;
    }

    let sqrt_price_diff = price_upper - price_lower;
    let liquidity_u256: u256 = liquidity.into();
    let q128_u256: u256 = 340282366920938463463374607431768211456; // 2^128

    // amount1 = L * (sqrt(P_b) - sqrt(P_a)) / 2^128
    let numerator = liquidity_u256 * sqrt_price_diff;
    let result = numerator / q128_u256;

    result.try_into().unwrap()
}

pub fn calculate_liquidity_delta(liquidity_gross: u128, liquidity_net: i128, upper: bool) -> i128 {
    if upper {
        -liquidity_net
    } else {
        liquidity_net
    }
}
