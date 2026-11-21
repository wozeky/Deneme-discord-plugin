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
