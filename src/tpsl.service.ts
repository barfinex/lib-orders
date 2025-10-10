import { OrderSide, OrderType, TradeSide } from '@barfinex/types';
import { math } from '@barfinex/utils';

/**
 * Расчёт TakeProfit / StopLoss цен
 */
export function getTPSLPrices(options: {
    positionSide: TradeSide,
    price: number,
    stopLossPercent: number,
    takeProfitPercent: number
}): { takeProfitPrice: number, stopLossPrice: number } {
    const { positionSide, price, stopLossPercent, takeProfitPercent } = options;

    const characters = math.numberOfCharactersBeforeAndAfter(price);
    const after = Math.max(2, characters.after) - 1;

    const exitSide = (positionSide === TradeSide.LONG) ? OrderSide.SELL : OrderSide.BUY;

    let takeProfitPrice = 0;
    let stopLossPrice = 0;

    if (exitSide === OrderSide.SELL) {
        stopLossPrice = Number((price - (price * stopLossPercent / 100)).toFixed(after));
        takeProfitPrice = Number((price + (price * takeProfitPercent / 100)).toFixed(after));
    } else {
        stopLossPrice = Number((price + (price * stopLossPercent / 100)).toFixed(after));
        takeProfitPrice = Number((price - (price * takeProfitPercent / 100)).toFixed(after));
    }

    return { takeProfitPrice, stopLossPrice };
}

/**
 * Хелпер: какие TPSL уже есть в аккаунте
 */
export function getTPSLOrders(options: { symbol: string, orders: any[] }) {
    const { symbol, orders } = options;
    return {
        takeProfit: orders.find(q => q.symbol === symbol && q.type === OrderType.TAKE_PROFIT_MARKET),
        stopLoss: orders.find(q => q.symbol === symbol && q.type === OrderType.STOP_MARKET),
    };
}
