# @barfinex/orders

**`@barfinex/orders`** is the **order management and execution layer** of the [Barfinex](https://barfinex.com) ecosystem — an open-source platform for algorithmic trading, quantitative research, and digital asset infrastructure.

This package consolidates **services, modules, and helpers** that implement unified order lifecycle management, including order creation, updates, cancellation, and tracking across supported trading connectors.

It ensures:
- 📊 **Consistency** — all order-related logic is handled in one place.
- ⚡ **Efficiency** — provides utilities for order metrics, TP/SL (take-profit & stop-loss) automation, and risk management.
- 🛡 **Reliability** — integrates with connectors and detectors to ensure accurate order execution.
- 🔌 **Extensibility** — can be extended with custom order-handling strategies.

---

It helps to:
- unify order handling logic;
- automate trade management (metrics, TP/SL, risk);
- ensure **type-safety** and clarity across services.

---

## 📦 Installation

To install the package, use npm or yarn:

```sh
npm install @barfinex/orders
```

or

```sh
yarn add @barfinex/orders
```

---

## 📚 What's Included

The `@barfinex/orders` package provides the following core modules:

- **OrderService** — core service for managing orders (creation, updates, cancellation).
- **OrderModule** — NestJS module wiring order services into microservices.
- **Order Helpers** — utilities for order transformation and normalization.
- **TPSLService** — automatic Take-Profit and Stop-Loss handling for open positions.
- **MetricsService** — tracking and analyzing order statistics and performance.
- **Integration with Detectors & Connectors** — streamlined pipelines for generating and executing trades.

---

## 🤝 Contributing

We welcome contributions to improve **order execution standards** in the Barfinex ecosystem:

- 🛠 Open an issue or submit a PR
- 💡 Suggest new features for automated trading and risk management
- 💬 Share use cases from your trading experience

Join the conversation in our Telegram community: [t.me/barfinex](https://t.me/barfinex)

---

## 📜 License

This repository is licensed under the [Apache License 2.0](LICENSE) with additional restrictions.

### Key Terms:
1. **Attribution**: Proper credit must be given to the original author, Barfin Network Limited, with a link to the official website: [https://barfin.network/](https://barfin.network/).
2. **Non-Commercial Use**: The use of this codebase for commercial purposes is prohibited without explicit written permission.
3. **Display Requirements**: For non-commercial use, the following must be displayed:
   - The name "Barfin Network Limited".
   - The official logo.
   - A working link to [https://barfinex.com/](https://barfinex.com/).

For further details or to request commercial use permissions, contact **Barfin Network Limited** through the official website.
