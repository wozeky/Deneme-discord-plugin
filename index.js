(function () {
  const v = window.vendetta || window.bunny;
  const { findByProps } = v.metro;
  const { instead } = v.patcher;

  let unpatchComm;
  let unpatchSco;

  return {
    onLoad() {
      const audioMod = findByProps("setCommunicationModeOn");
      if (!audioMod) return;

      audioMod.setSCORetryCount?.(0);
      audioMod.setCommunicationModeOn?.(false);

      unpatchComm = instead("setCommunicationModeOn", audioMod, function (args, orig) {
        return orig.call(audioMod, false);
      });

      if (typeof audioMod.setSCORetryCount === "function") {
        unpatchSco = instead("setSCORetryCount", audioMod, function (args, orig) {
          return orig.call(audioMod, 0);
        });
      }
    },

    onUnload() {
      unpatchComm?.();
      unpatchSco?.();
    }
  };
})()
