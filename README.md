# A2DP Audio Router

Revenge/Vendetta/Bunny Discord client plugin attempting to keep Bluetooth audio in A2DP mode during voice calls.

## Installation
Host the files on GitHub Pages, then add the Pages URL in the client's plugin installer.

## Behavior
- Tries to disable communication mode.
- Sets SCO retry count to zero.
- Restores patches when unloaded.

## Limitations
This is an experimental JavaScript patch, not an Android audio policy override. A2DP output and the built-in phone microphone are not guaranteed to work simultaneously. Compatibility varies by Android version and client implementation.

## Files
- `index.js`: eval-compatible IIFE
- `manifest.json`: plugin metadata and SHA-256 of index.js

## Optimize Revenge

Android'deki Vendetta uyumlu Revenge istemcisi için ayrı performans eklentisi. Süper Tepki oynatma efektlerini ve başka kanallardaki yazma bildirimlerini ayrı ayrı kapatabilirsiniz. Açık kanal belirlenemediğinde yazma bildirimleri normal işlenir. Ayarlarda bu oturumda kaç olayın atlandığını görebilirsiniz.

Revenge → Eklentiler → **+** ekranına bu adresi yapıştırın:

```text
https://raw.githubusercontent.com/wozeky/Deneme-discord-plugin/main/OptimizeRevenge/
```

[DiscordOptimizer](https://github.com/thedragon8592/revenge-plugins/tree/main/DiscordOptimizer) fikrinden yola çıkılarak bağımsız yazıldı. Eski DiscordOptimizer kuruluysa karşılaştırmadan önce onu kapatın. Belirli bir FPS artışı ölçülmedi. Yerel test: `node --test tests/optimize-revenge.test.cjs`.
