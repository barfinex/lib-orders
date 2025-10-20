import {
    Account,
    Order,
    Position,
    OrderSide,
    TradeSide,
    OrderType,
    Symbol as TradingSymbol,
} from '@barfinex/types';

/** Убедиться, что в аккаунте есть массивы */
export function ensureAccountArrays(account: Account): Account {
    account.orders ??= [];
    account.positions ??= [];
    account.assets ??= [];
    account.symbols ??= [];
    return account;
}

/** Проверка цены с учётом epsilon */
export function isSamePrice(a?: number, b?: number, eps = 1e-8): boolean {
    if (a == null || b == null) return a === b;
    return Math.abs(a - b) <= eps;
}

/** Маппинг сторон ордера в сторону позиции */
function orderSideToTradeSide(side?: OrderSide | null): TradeSide {
    return side === OrderSide.BUY ? TradeSide.LONG : TradeSide.SHORT;
}

/** Применить маркет-ордер к позициям аккаунта */
export function applyMarketOrderToPositions(account: Account, order: Order): Account {
    account = ensureAccountArrays(account);

    const qty = Math.abs(order.quantity ?? 0);
    if (!qty) return account;

    // гарантируем нужные поля; здесь предполагается, что MARKET-ордер всегда с price/symbol/side
    const price = order.price!;
    const symbol = order.symbol as TradingSymbol; // в нашем домене он обязателен
    const tradeSide = orderSideToTradeSide(order.side);
    const leverage = order.leverage ?? 1;

    // ищем позицию по имени символа (объекты Symbol разные, сравниваем по name)
    const existing = account.positions.find((p) => p.symbol.name === symbol.name);

    // нет позиции — открываем новую
    if (!existing) {
        const position: Position = {
            connectorType: order.connectorType,
            marketType: order.marketType,
            symbol,
            quantity: qty,
            entryPrice: price,
            lastPrice: price,
            initialMargin: (price * qty) / (leverage || 1),
            leverage,
            side: tradeSide,
            // необязательные поля, если есть в интерфейсе:
            // entryTime: Date.now(),
            // tpExecuted: [],
        } as Position;

        account.positions.push(position);
        return account;
    }

    // есть позиция
    if (existing.side === tradeSide) {
        // наращиваем позицию и пересчитываем среднюю цену входа
        const newQty = existing.quantity + qty;
        const newEntry =
            (existing.entryPrice * existing.quantity + price * qty) / (newQty || 1);

        existing.quantity = newQty;
        existing.entryPrice = newEntry;
        existing.lastPrice = price;
        // маржу можно обновлять пропорционально; здесь — пересчёт от актуального входа
        existing.initialMargin = (existing.entryPrice * existing.quantity) / (existing.leverage || 1);
    } else {
        // встречная сделка — частичное/полное закрытие или разворот
        const rest = existing.quantity - qty;

        if (rest > 0) {
            // частичное закрытие
            existing.quantity = rest;
            existing.lastPrice = price;
            existing.initialMargin = (existing.entryPrice * existing.quantity) / (existing.leverage || 1);
        } else if (rest === 0) {
            // полное закрытие
            account.positions = account.positions.filter((p) => p.symbol.name !== existing.symbol.name);
        } else {
            // разворот: закрыли старую и открыли в обратную сторону остатком
            const newAbsQty = Math.abs(rest);
            const newLev = order.leverage ?? existing.leverage ?? 1;

            existing.side = tradeSide;
            existing.quantity = newAbsQty;
            existing.entryPrice = price;
            existing.lastPrice = price;
            existing.leverage = newLev;
            existing.initialMargin = (price * newAbsQty) / (newLev || 1);
        }
    }

    return account;
}

/** Sandbox-режим: симуляция */
export function applyOrderOnSandbox(account: Account, order: Order): Account {
    if (order.type === OrderType.MARKET) {
        return applyMarketOrderToPositions(account, order);
    }
    return account;
}

export function applyCloseToSandbox(account: Account, _order: Order): Account {
    return account;
}
