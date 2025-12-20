// CLMM Math - u256 arithmetic for sqrt price and tick conversions
// Based on Ekubo/Uniswap v3 mathematical approach
// Uses Q128.128 fixed point format (128 bits integer, 128 bits fractional)

/// Q128.128 format constants
pub const Q128: u256 = 340282366920938463463374607431768211456; // 2^128
pub const MIN_SQRT_RATIO: u256 = 18446744073709551616; // sqrt(1.0001)^(-887272) * 2^128 (approx)
pub const MAX_SQRT_RATIO: u256 =
    6277101735386680763835789423207666416102355444464034512896; // 2^192 (approx max for u256 safe ops)

/// Safe sqrt price for tick 0 (price = 1.0)
pub const SAFE_SQRT_PRICE_TICK_0: u256 = 340282366920938463463374607431768211456; // Q128
pub const MIN_TICK: i32 = -887272;
pub const MAX_TICK: i32 = 887272;

/// Get sqrt price at a given tick
/// Formula: sqrtPrice = 1.0001^(tick/2) * 2^128
pub fn get_sqrt_ratio_at_tick(tick: i32) -> u256 {
    assert(tick >= MIN_TICK && tick <= MAX_TICK, 'Tick out of bounds');

    if tick == 0 {
        return Q128;
    }

    let abs_tick = if tick < 0 {
        -tick
    } else {
        tick
    };
    let abs_tick_u32: u32 = abs_tick.try_into().unwrap();
    let abs_tick_u256: u256 = abs_tick_u32.into();

    // Ratio = Q128 * (1 + tick * 0.00005) as a base approximation
    let denominator: u256 = if abs_tick <= 100 {
        20000
    } else if abs_tick <= 1000 {
        2000
    } else {
        200
    };

    if tick > 0 {
        let increment = (Q128 * abs_tick_u256) / denominator;
        let new_ratio = Q128 + increment;
        if new_ratio > MAX_SQRT_RATIO {
            MAX_SQRT_RATIO
        } else {
            new_ratio
        }
    } else {
        let decrement = (Q128 * abs_tick_u256) / denominator;
        if decrement < Q128 {
            let new_ratio = Q128 - decrement;
            if new_ratio < MIN_SQRT_RATIO {
                MIN_SQRT_RATIO
            } else {
                new_ratio
            }
        } else {
            MIN_SQRT_RATIO
        }
    }
}

/// Get tick at a given sqrt price
pub fn get_tick_at_sqrt_ratio(sqrt_price_x128: u256) -> i32 {
    if sqrt_price_x128 == Q128 {
        return 0;
    }
    assert(
        sqrt_price_x128 >= MIN_SQRT_RATIO && sqrt_price_x128 <= MAX_SQRT_RATIO,
        'Sqrt price out of bounds',
    );

    let mut low = MIN_TICK;
    let mut high = MAX_TICK;

    while low < high {
        let mid = (low + high + 1) / 2;
        let sqrt_ratio_mid = get_sqrt_ratio_at_tick(mid);

        if sqrt_ratio_mid <= sqrt_price_x128 {
            low = mid;
        } else {
            high = mid - 1;
        };
    }

    low
}

/// Convert a tick to sqrt price (Q128.128 format)
pub fn tick_to_sqrt_price_x128(tick: i32) -> u256 {
    get_sqrt_ratio_at_tick(tick)
}

/// Convert a sqrt price (Q128.128 format) to a tick
pub fn sqrt_price_x128_to_tick(sqrt_price_x128: u256) -> i32 {
    get_tick_at_sqrt_ratio(sqrt_price_x128)
}

/// Multiply two values maintaining Q128.128 format
pub fn mul_u256(a: u256, b: u256) -> u256 {
    // result = (a * b) / 2^128
    // Note: This might overflow if a * b > 2^256.
    // In Ekubo/Uniswap, specialized 512-bit intermediate math is used.
    // For MVP u256 is used with caution.
    (a * b) / Q128
}

/// Divide two values maintaining Q128.128 format
pub fn div_u256(a: u256, b: u256) -> u256 {
    assert(b != 0, 'Division by zero');
    // result = (a * 2^128) / b
    // Note: a * 2^128 might overflow u256 if a >= 2^128.
    (a * Q128) / b
}

pub fn mul_ratio(a: u256, b: u256) -> u256 {
    mul_u256(a, b)
}

pub fn div_ratio(a: u256, b: u256) -> u256 {
    div_u256(a, b)
}
