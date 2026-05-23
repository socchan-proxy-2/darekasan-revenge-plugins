"use strict";
var __plugin__ = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });
  var messageCache = /* @__PURE__ */ new Map();
  var deletedMessages = /* @__PURE__ */ new Set();
  var editHistory = /* @__PURE__ */ new Map();
  var cleanups = [];
  var DELETED_PREFIX = "\u{1F5D1}\uFE0F";
  var EDITED_MARKER = "\u270F\uFE0F";
  var index_default = {
    name: "MessageLogger",
    description: "\u524A\u9664\u30FB\u7DE8\u96C6\u3055\u308C\u305F\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u30ED\u30B0\u306B\u6B8B\u3057\u3066\u8868\u793A\u3057\u307E\u3059",
    authors: [{ name: "Claude" }],
    start() {
      const { findByProps } = revenge.modules.finders;
      const { after } = revenge.patcher;
      const Dispatcher = findByProps("dispatch", "subscribe", "unsubscribe");
      if (!Dispatcher) return console.error("[MessageLogger] Dispatcher not found");
      const onMessageCreate = ({ message }) => {
        var _a, _b;
        if (message == null ? void 0 : message.id) {
          messageCache.set(message.id, {
            id: message.id,
            channel_id: message.channel_id,
            content: (_a = message.content) != null ? _a : "",
            author: message.author,
            attachments: (_b = message.attachments) != null ? _b : [],
            timestamp: message.timestamp
          });
        }
      };
      const onMessageUpdate = ({ message }) => {
        var _a, _b;
        if (!(message == null ? void 0 : message.id)) return;
        const cached = messageCache.get(message.id);
        if ((cached == null ? void 0 : cached.content) !== void 0 && cached.content !== message.content) {
          const history = (_a = editHistory.get(message.id)) != null ? _a : [];
          history.push(cached.content);
          editHistory.set(message.id, history);
        }
        if (cached) {
          messageCache.set(message.id, __spreadProps(__spreadValues({}, cached), { content: (_b = message.content) != null ? _b : "" }));
        }
      };
      const onMessageDelete = ({ id }) => {
        if (id) deletedMessages.add(id);
      };
      Dispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
      Dispatcher.subscribe("MESSAGE_UPDATE", onMessageUpdate);
      Dispatcher.subscribe("MESSAGE_DELETE", onMessageDelete);
      cleanups.push(
        () => Dispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate),
        () => Dispatcher.unsubscribe("MESSAGE_UPDATE", onMessageUpdate),
        () => Dispatcher.unsubscribe("MESSAGE_DELETE", onMessageDelete)
      );
      const MessageStore = findByProps("getMessage", "getMessages");
      if (MessageStore) {
        cleanups.push(
          after("getMessage", MessageStore, ([_channelId, messageId], result) => {
            if (result) {
              const history = editHistory.get(messageId);
              if (history == null ? void 0 : history.length) {
                return __spreadProps(__spreadValues({}, result), {
                  content: `${result.content}
${EDITED_MARKER} *\u5143\u306E\u5185\u5BB9: ${history[history.length - 1]}*`
                });
              }
              return result;
            }
            if (deletedMessages.has(messageId)) {
              const cached = messageCache.get(messageId);
              if (cached) {
                return __spreadProps(__spreadValues({}, cached), {
                  content: `${DELETED_PREFIX} ~~${cached.content}~~`,
                  _mlDeleted: true
                });
              }
            }
          })
        );
      }
      console.log("[MessageLogger] started");
    },
    stop() {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
      messageCache.clear();
      deletedMessages.clear();
      editHistory.clear();
      console.log("[MessageLogger] stopped");
    }
  };
  return __toCommonJS(index_exports);
})();
module.exports = __plugin__.__esModule ? __plugin__.default : __plugin__;
