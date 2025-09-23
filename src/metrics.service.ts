import { OrderSide } from '@barfinex/types';

/**
 * Break-even price (учёт комиссий)
 */
export function calculateBreakEvenPrice(entryPrice: number, feeRate: number, side: OrderSide): number {
    return side === OrderSide.BUY
        ? entryPrice * (1 + 2 * feeRate * 1.25)
        : entryPrice * (1 - 2 * feeRate * 1.25);
}

/**
 * Profit and Loss
 */
export function calculatePnL(entryPrice: number, exitPrice: number, quantity: number): number {
    return Number(((exitPrice - entryPrice) * quantity).toFixed(2));
}

/**
 * ROI %
 */
export function calculateROI(pnl: number, initialMargin: number): number {
    return Number(((pnl / initialMargin) * 100).toFixed(2));
}

/**
 * Проверка, пора ли подтянуть SL к BEP
 */
export function isBreakEvenPriceActive(
    stopLossPrice: number,
    breakEvenPrice: number,
    roi: number,
    positionSide: OrderSide
): boolean {
    if (!stopLossPrice) return false;
    if (roi <= 1.5) return false;
    return (
        (positionSide === OrderSide.BUY && stopLossPrice < breakEvenPrice) ||
        (positionSide === OrderSide.SELL && stopLossPrice > breakEvenPrice)
    );
}
