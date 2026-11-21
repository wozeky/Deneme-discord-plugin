(function (api) {
  const metro = api?.metro;
  const common = metro?.common;
  const preferences = api?.plugin?.storage ?? {};
  const skipped = Promise.resolve();
  let unpatch;
  let selectedChannel;
  let typingCount = 0;
  let effectCount = 0;
  let filterTyping;
  let filterEffects;

  function readPreferences() {
    filterTyping = preferences.filterTyping !== false;
    filterEffects = preferences.filterEffects !== false;
  }

  function intercept(args, original) {
    const event = args[0];
    switch (event?.type) {
      case "BURST_REACTION_EFFECT_PLAY":
        if (filterEffects) {
          effectCount++;
          return skipped;
        }
        break;
      case "TYPING_START":
        if (filterTyping && selectedChannel) {
          const channelId = event.channelId ?? event.channel_id;
          if (typeof channelId !== "string" || !channelId) break;
          let current;
          try {
            current = selectedChannel.getChannelId();
          } catch {
            // Forward typing if the store becomes unavailable during startup.
            break;
          }
          if (typeof current === "string" && current && current !== channelId) {
            typingCount++;
            return skipped;
          }
        }
    }
    return original.apply(this, args);
  }

  function onLoad() {
    if (unpatch) return;
    const dispatcher = common?.FluxDispatcher ?? metro?.findByProps?.("dispatch", "subscribe", "unsubscribe");
    if (!dispatcher || typeof dispatcher.dispatch !== "function" || !api?.patcher?.instead) {
      throw new Error("Optimize Revenge bu sürümde Discord olaylarına erişemedi.");
    }
    try {
      const store = metro.findByStoreName?.("SelectedChannelStore");
      selectedChannel = typeof store?.getChannelId === "function" ? store : undefined;
    } catch {
      selectedChannel = undefined;
    }
    readPreferences();
    unpatch = api.patcher.instead("dispatch", dispatcher, intercept);
  }

  function onUnload() {
    unpatch?.();
    unpatch = undefined;
    selectedChannel = undefined;
    typingCount = effectCount = 0;
  }

  function Settings() {
    const { React, ReactNative } = common;
    const { ScrollView, Text, Switch, View, Button } = ReactNative;
    const [, refresh] = React.useReducer(n => n + 1, 0);
    const dark = ReactNative.useColorScheme?.() !== "light";
    const color = dark ? "#f2f3f5" : "#202124";
    function row(key, label, available) {
      return React.createElement(View, { style: { flexDirection: "row", alignItems: "center", paddingVertical: 10 } },
        React.createElement(Text, { style: { flex: 1, color } }, label),
        React.createElement(Switch, {
          accessibilityLabel: label,
          disabled: !available,
          value: available && preferences[key] !== false,
          onValueChange(value) {
            preferences[key] = value;
            readPreferences();
            refresh();
          }
        }));
    }
    return React.createElement(ScrollView, { contentContainerStyle: { padding: 16 } },
      row("filterTyping", "Diğer kanallardaki yazma göstergelerini atla", !!selectedChannel),
      !selectedChannel && React.createElement(Text, { style: { color } }, "Bu sürümde açık kanal algılanamadı."),
      row("filterEffects", "Süper Tepki efektlerini atla", true),
      React.createElement(Text, { style: { color, marginVertical: 12 } },
        "Bu oturumda atlanan yazma bildirimi: " + typingCount + "\nAtlanan tepki efekti: " + effectCount),
      React.createElement(Button, { title: "Sayaçları yenile", onPress: refresh }));
  }

  return { onLoad, onUnload, settings: Settings };
})(typeof vendetta !== "undefined" ? vendetta : globalThis.vendetta ?? globalThis.bunny)
