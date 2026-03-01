# @barfinex/orders

**Order management and execution layer** for the [Barfinex](https://barfinex.com) ecosystem — create, update, cancel, and track orders in one place, with TP/SL and metrics support.

This library unifies order lifecycle across connectors and detectors. Use it in Provider, Detector, or any service that needs to place or manage orders so logic stays consistent and type-safe.

---

## What it does

- **Order lifecycle** — `OrderService` for creation, updates, and cancellation; integration with connectors and detectors.
- **TP/SL** — `TPSLService` for take-profit and stop-loss handling on open positions.
- **Metrics** — `MetricsService` for order and performance statistics.
- **NestJS** — `OrderModule` and helpers for transformation and normalization aligned with `@barfinex/types`.

---

## Installation

```sh
npm install @barfinex/orders
```

or

```sh
yarn add @barfinex/orders
```

---

## What's included

| Export | Purpose |
|--------|--------|
| `OrderModule` | NestJS module wiring order services. |
| `OrderService` | Core order CRUD and execution. |
| `OrderHelpers` | Transform and normalize order data. |
| `MetricsService` | Order and performance metrics. |
| `TPSLService` | Take-profit and stop-loss automation. |

---

## Documentation

- **Barfinex overview** — [First Steps](https://barfinex.com/docs/first-steps), [Architecture](https://barfinex.com/docs/architecture), [Glossary](https://barfinex.com/docs/glossary).
- **Provider (order API)** — [Installation provider](https://barfinex.com/docs/installation-provider), [Provider API reference](https://barfinex.com/docs/provider-api).
- **Detector (signal → orders)** — [Installation detector](https://barfinex.com/docs/installation-detector), [Signals context API](https://barfinex.com/docs/signals-context).
- **Inspector (risk)** — [Inspector overview](https://barfinex.com/docs/inspector-overview), [Inspector risk policies](https://barfinex.com/docs/inspector-risk-policies).
- **Building & troubleshooting** — [Building with the API](https://barfinex.com/docs/frontend-api), [Typical problems and solutions](https://barfinex.com/docs/troubleshooting).

---

## Contributing

Ideas for order automation and risk features are welcome. Open an issue or PR. Community: [Telegram](https://t.me/barfinex) · [GitHub](https://github.com/barfinex).

---

## License

Licensed under the [Apache License 2.0](LICENSE) with additional terms. Attribution to **Barfin Network Limited** and a link to [https://barfinex.com](https://barfinex.com) are required. Commercial use requires explicit permission. See [LICENSE](LICENSE) and the [Barfinex site](https://barfinex.com) for details.
