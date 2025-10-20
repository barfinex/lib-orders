import {
    Inject,
    Injectable,
    Optional,
    forwardRef,
} from '@nestjs/common';

import {
    Account,
    Order,
    PluginHook,
    OrderSide,
    OrderType,
    Position,
    Symbol,
    TradeSide,
    ConnectorType,
    MarketType,
    OrderSourceType,
    OrderSource,
} from '@barfinex/types';

import { ConnectorService } from '@barfinex/connectors';
import { PluginDriverService } from '@barfinex/plugin-driver';

import {
    ensureAccountArrays,
    isSamePrice,
    applyMarketOrderToPositions,
} from './order.helpers';

import {
    calculateBreakEvenPrice,
    calculatePnL,
    calculateROI,
    isBreakEvenPriceActive,
} from './metrics.service';

import { getTPSLOrders, getTPSLPrices } from './tpsl.service';

@Injectable()
export class OrderService {
    constructor(
        private readonly connectorService: ConnectorService,
        @Optional() @Inject(forwardRef(() => PluginDriverService))
        private readonly pluginDriverService?: PluginDriverService,
    ) { }

    /**
     * Алиас для старого API
     */
    async placeOrder(options: {
        order: Order;
        providerRestApiUrl: string;
        openOrderMoment?: number;
        account: Account;
    }): Promise<{ order: Order; account: Account; openOrderMoment: number }> {
        return this.openOrder(options);
    }

    /**
     * Открытие ордера
     */
    async openOrder(options: {
        order: Order;
        providerRestApiUrl: string;
        openOrderMoment?: number;
        account: Account;
    }): Promise<{ order: Order; account: Account; openOrderMoment: number }> {
        let { order, account, openOrderMoment, providerRestApiUrl } = options;

        order = { ...order };
        account = ensureAccountArrays(account);

        order.useSandbox = !!order.useSandbox;
        order.quantity = Math.abs(order.quantity ?? 0);

        const millis =
            typeof openOrderMoment === 'number'
                ? Date.now() - openOrderMoment
                : Number.POSITIVE_INFINITY;

        if (!order.price && order.type !== OrderType.MARKET) {
            throw new Error(
                `[${order.source?.type ?? 'unknown'}:${order.source?.key ?? 'n/a'
                }] Not enough price data to create order (non-market).`,
            );
        }

        if (
            ![
                OrderType.STOP,
                OrderType.STOP_MARKET,
                OrderType.TAKE_PROFIT,
                OrderType.TAKE_PROFIT_MARKET,
            ].includes(order.type!)
        ) {
            if (millis < 1000) {
                throw new Error(
                    `[${order.source?.type ?? 'unknown'}:${order.source?.key ?? 'n/a'
                    }] openOrder() called too often`,
                );
            }
        }

        const duplicate = account.orders?.find(
            (q) =>
                q.connectorType === order.connectorType &&
                q.marketType === order.marketType &&
                q.symbol?.name === order.symbol?.name &&
                q.type === order.type &&
                q.side === order.side &&
                q.quantity === order.quantity &&
                (order.type === OrderType.MARKET || isSamePrice(q.price ?? undefined, order.price ?? undefined)),
        );

        if (duplicate) {
            order = { ...duplicate };
        } else {
            order = await this.connectorService.openOrder({
                order,
                providerRestApiUrl,
            });
        }

        if (order.type === OrderType.MARKET) {
            account = applyMarketOrderToPositions(account, order);
        } else {
            account.orders.push(order);
        }

        if (this.pluginDriverService) {
            await this.pluginDriverService.asyncReduce(
                PluginHook.onOrderOpen,
                order,
            );
        }

        openOrderMoment = Date.now();

        if (order.useSandbox) {
            if (!account.orders.find((o) => o.externalId === order.externalId)) {
                account.orders.push(order);
            }
            account = applyMarketOrderToPositions(account, order);
        }

        return { order: { ...order }, account, openOrderMoment };
    }

    /**
     * Закрытие ордера
     */
    async closeOrder(options: {
        order: Order;
        closePrice: number;
        account: Account;
        providerRestApiUrl: string;
    }): Promise<{ order: Order; account: Account }> {
        let { order, closePrice, account, providerRestApiUrl } = options;

        order = { ...order };
        account = ensureAccountArrays(account);

        order.useSandbox = !!order.useSandbox;
        order.priceClose = closePrice;
        order.quantityExecuted = order.quantity;

        await this.connectorService.closeOrder({
            order,
            providerRestApiUrl,
        });

        account.orders = account.orders.filter(
            (q) => q.externalId !== order.externalId,
        );

        return { order: { ...order }, account };
    }

    /**
     * Открытие позиции по маркету
     */
    async openPosition(options: {
        account: Account;
        symbol: Symbol;
        side: TradeSide;
        quantity: number;
        price?: number;
        providerRestApiUrl: string;
        useSandbox?: boolean;
    }): Promise<{ position: Position; account: Account }> {
        const {
            account,
            symbol,
            side,
            quantity,
            price,
            providerRestApiUrl,
            useSandbox,
        } = options;


        if (!account.connectorType || !account.marketType) {
            throw new Error('Account is missing connectorType or marketType');
        }

        const { account: updatedAccount } = await this.openOrder({
            order: {
                symbol,
                side: side === TradeSide.LONG ? OrderSide.BUY : OrderSide.SELL,
                type: OrderType.MARKET,
                quantity,
                price,
                useSandbox: !!useSandbox,
                connectorType: account.connectorType,
                marketType: account.marketType,
                source: {
                    type: OrderSourceType.detector,
                    key: 'algo-strategy',
                    restApiUrl: providerRestApiUrl,
                },
            },
            account,
            providerRestApiUrl,
        });

        const position = updatedAccount.positions.find(
            (p) => p.symbol.name === symbol.name && p.side === side,
        );

        if (!position) {
            throw new Error(`Position was not created for ${symbol.name}`);
        }

        return { position, account: updatedAccount };
    }

    /**
     * Закрытие позиции (полностью или частично)
     */
    async closePosition(options: {
        position: Position;
        account: Account;
        providerRestApiUrl: string;
        quantity?: number;
        useSandbox?: boolean;
    }): Promise<{ order: Order; account: Account }> {
        const { position, account, providerRestApiUrl, quantity, useSandbox } =
            options;

        const side: OrderSide =
            position.side === TradeSide.LONG ? OrderSide.SELL : OrderSide.BUY;

        if (!account.connectorType || !account.marketType) {
            throw new Error('Account is missing connectorType or marketType');
        }

        const { order, account: updatedAccount } = await this.openOrder({
            order: {
                symbol: position.symbol,
                side,
                type: OrderType.MARKET,
                quantity: quantity ?? position.quantity,
                price: position.lastPrice,
                useSandbox: useSandbox ?? false,
                connectorType: account.connectorType,
                marketType: account.marketType,
                source: {
                    type: OrderSourceType.detector,
                    key: 'algo-strategy',
                    restApiUrl: providerRestApiUrl,
                },
            },
            providerRestApiUrl,
            account,
        });

        return { order, account: updatedAccount };
    }

    /**
     * ================== TPSL и метрики ==================
     */
    getTPSLOrders = getTPSLOrders;
    getTPSLPrices = getTPSLPrices;
    calculateBreakEvenPrice = calculateBreakEvenPrice;
    calculatePnL = calculatePnL;
    calculateROI = calculateROI;
    isBreakEvenPriceActive = isBreakEvenPriceActive;

    /**
     * ================== Trailing Stop ==================
     */
    updateTrailingStop(
        lastPrice: number,
        position: Position,
        trailingStopDistance: number,
    ): number | undefined {
        const distance = lastPrice * trailingStopDistance;

        if (position.side === TradeSide.LONG) {
            const newStop = lastPrice - distance;
            if (!position.trailingStop || newStop > position.trailingStop) {
                return newStop;
            }
        } else if (position.side === TradeSide.SHORT) {
            const newStop = lastPrice + distance;
            if (!position.trailingStop || newStop < position.trailingStop) {
                return newStop;
            }
        }
        return position.trailingStop;
    }
}
