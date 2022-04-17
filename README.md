<div align="center">

![Kirishima Banner](https://cdn.discordapp.com/attachments/891939988088975372/931079377771450388/kirishima-ship-banner.png)

# @kirishima/queue

</div>

# Instalation 
```
npm install @kirishima/queue @kirishima/core
```

# Features
- Written in TypeScript
- Support ESM & CommonJS

# Example 
```ts
import { KirishimaQueue } from "@kirishima/queue";
import { Kirishima } from "@kirishima/core";

const kirishima = new Kirishima({
    plugins: [
        new KirishimaQueue()
    ]
});
```
