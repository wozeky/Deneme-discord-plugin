const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");
const vm = require("node:vm");
const path = require("node:path");

const dir = path.join(__dirname, "../OptimizeRevenge");
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json")));
const source = fs.readFileSync(path.join(dir, manifest.main), "utf8");

function client(store = { getChannelId: () => "11" }, storage = {}) {
  const forwarded = [];
  const result = Promise.resolve("done");
  const dispatcher = { dispatch(...args) { forwarded.push({ args, self: this }); return result; } };
  const initial = dispatcher.dispatch;
  let searches = 0;
  const react = { createElement: (type, props, ...children) => ({ type, props, children }), useReducer: () => [0, () => {}] };
  const api = {
    metro: {
      common: { FluxDispatcher: dispatcher, React: react, ReactNative: { Switch: "Switch" } },
      findByStoreName(name) { assert.equal(name, "SelectedChannelStore"); searches++; return store; }
    },
    plugin: { storage },
    patcher: { instead(name, target, callback) {
      const previous = target[name];
      target[name] = function (...args) { return callback.call(this, args, previous); };
      return () => { target[name] = previous; };
    } }
  };
  const plugin = vm.runInNewContext("vendetta => {return " + source + "}")(api);
  return { api, plugin, dispatcher, forwarded, initial, result, storage, searches: () => searches };
}

test("manifest matches the served program", () => {
  assert.equal(crypto.createHash("sha256").update(source).digest("hex"), manifest.hash);
});

test("only off-channel typing and burst playback are intercepted", async () => {
  let channel = "11";
  const c = client({ getChannelId: () => channel });
  c.plugin.onLoad();
  for (const type of ["SPEAKING", "RTC_CONNECTION_QUALITY", "VOICE_STATE_UPDATES", "MESSAGE_CREATE", "MESSAGE_ACK",
    "MESSAGE_REACTION_ADD", "GUILD_MEMBER_UPDATE", "PRESENCE_UPDATE", "NEW_EVENT"]) {
    const event = { type };
    assert.equal(c.dispatcher.dispatch(event, 42), c.result);
    assert.deepEqual(c.forwarded.at(-1).args, [event, 42]);
    assert.equal(c.forwarded.at(-1).self, c.dispatcher);
  }
  c.dispatcher.dispatch({ type: "TYPING_START", channelId: channel });
  c.dispatcher.dispatch({ type: "TYPING_START" });
  const before = c.forwarded.length;
  await c.dispatcher.dispatch({ type: "TYPING_START", channel_id: "22" });
  await c.dispatcher.dispatch({ type: "BURST_REACTION_EFFECT_PLAY" });
  assert.equal(c.forwarded.length, before);
  channel = "22";
  assert.equal(c.dispatcher.dispatch({ type: "TYPING_START", channel_id: channel }), c.result);
  assert.equal(c.searches(), 1);
});

test("missing, uninitialized or throwing channel store forwards typing", () => {
  for (const store of [null, { getChannelId: () => null }, { getChannelId() { throw Error(); } }]) {
    const c = client(store);
    c.plugin.onLoad();
    assert.equal(c.dispatcher.dispatch({ type: "TYPING_START", channelId: "22" }), c.result);
  }
});

test("settings apply immediately, survive reload and restore the previous dispatcher", () => {
  const c = client(undefined, { filterEffects: false });
  c.plugin.onLoad();
  const once = c.dispatcher.dispatch;
  c.plugin.onLoad();
  assert.equal(c.dispatcher.dispatch, once);
  assert.equal(c.dispatcher.dispatch({ type: "BURST_REACTION_EFFECT_PLAY" }), c.result);
  const switchNode = c.plugin.settings().children[0].children.find(child => child.type === "Switch");
  switchNode.props.onValueChange(false);
  assert.equal(c.storage.filterTyping, false);
  const event = { type: "TYPING_START", channelId: "22" };
  assert.equal(c.dispatcher.dispatch(event), c.result);
  c.plugin.onUnload();
  c.plugin.onUnload();
  assert.equal(c.dispatcher.dispatch, c.initial);
  c.plugin.onLoad();
  assert.equal(c.dispatcher.dispatch(event), c.result);
});

test("unsupported dispatcher produces a visible loading error", () => {
  const c = client();
  delete c.api.metro.common.FluxDispatcher;
  assert.throws(() => c.plugin.onLoad(), /Discord/);
  c.plugin.onUnload();
});
