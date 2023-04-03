"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const case_1 = require("../case");
const constants_1 = require("../constants");
const eventEmitter_1 = __importDefault(require("../eventEmitter"));
class WebBridge {
    constructor() {
        this.eventEmitter = new eventEmitter_1.default();
        this.addGlobalListener();
        this.logsEnabled = false;
        this.isRenameParamsEnabledForBotx = true;
        this.handler = null;
    }
    addGlobalListener() {
        window.addEventListener('message', (event) => {
            if (typeof event.data !== 'object' ||
                typeof event.data.data !== 'object' ||
                typeof event.data.data.type !== 'string')
                return;
            const _a = event.data, { ref } = _a, _b = _a.data, { type } = _b, payload = __rest(_b, ["type"]), { files } = _a;
            const isRenameParamsEnabled = this.handler === constants_1.HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : false;
            if (this.logsEnabled)
                console.log('Bridge ~ Incoming event', event.data);
            const emitterType = ref || constants_1.EVENT_TYPE.RECEIVE;
            const eventFiles = isRenameParamsEnabled ?
                files === null || files === void 0 ? void 0 : files.map((file) => (0, case_1.snakeCaseToCamelCase)(file)) : files;
            this.eventEmitter.emit(emitterType, {
                ref,
                type,
                payload: isRenameParamsEnabled ? (0, case_1.snakeCaseToCamelCase)(payload) : payload,
                files: eventFiles,
            });
        });
    }
    /**
     * Set callback function to handle events without **ref**
     * (notifications for example).
     *
     * ```js
     * bridge.onReceive(({ type, handler, payload }) => {
     *   // Handle event data
     *   console.log('event', type, handler, payload)
     * })
     * ```
     */
    onReceive(callback) {
        this.eventEmitter.on(constants_1.EVENT_TYPE.RECEIVE, callback);
    }
    sendEvent({ handler, method, params, files, timeout = constants_1.RESPONSE_TIMEOUT, guaranteed_delivery_required = false, }) {
        const isRenameParamsEnabled = handler === constants_1.HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : false;
        const ref = (0, uuid_1.v4)(); // UUID to detect express response.
        this.handler = handler;
        const payload = {
            ref,
            type: constants_1.WEB_COMMAND_TYPE_RPC,
            method,
            handler,
            payload: isRenameParamsEnabled ? (0, case_1.camelCaseToSnakeCase)(params) : params,
            guaranteed_delivery_required,
        };
        const eventFiles = isRenameParamsEnabled ?
            files === null || files === void 0 ? void 0 : files.map((file) => (0, case_1.camelCaseToSnakeCase)(file)) : files;
        const event = files ? Object.assign(Object.assign({}, payload), { files: eventFiles }) : payload;
        if (this.logsEnabled)
            console.log('Bridge ~ Outgoing event', event);
        window.parent.postMessage({
            type: constants_1.WEB_COMMAND_TYPE,
            payload: event,
        }, '*');
        return this.eventEmitter.onceWithTimeout(ref, timeout);
    }
    /**
     * Send event and wait response from express client.
     *
     * ```js
     * bridge
     *   .sendClientEvent(
     *     {
     *       method: 'get_weather',
     *       params: {
     *         city: 'Moscow',
     *       },
     *     }
     *   )
     *   .then(data => {
     *     // Handle response
     *     console.log('response', data)
     *   })
     * ```
     */
    sendBotEvent({ method, params, files, timeout, guaranteed_delivery_required, }) {
        return this.sendEvent({
            handler: constants_1.HANDLER.BOTX,
            method,
            params,
            files,
            timeout,
            guaranteed_delivery_required,
        });
    }
    /**
     * Send event and wait response from express client.
     *
     * ```js
     * bridge
     *   .sendClientEvent(
     *     {
     *       method: 'get_weather',
     *       params: {
     *         city: 'Moscow',
     *       },
     *     }
     *   )
     *   .then(data => {
     *     // Handle response
     *     console.log('response', data)
     *   })
     * ```
     */
    sendClientEvent({ method, params, timeout }) {
        return this.sendEvent({
            handler: constants_1.HANDLER.EXPRESS,
            method,
            params,
            timeout,
        });
    }
    /**
     * Enabling logs.
     *
     * ```js
     * bridge
     *   .enableLogs()
     * ```
     */
    enableLogs() {
        this.logsEnabled = true;
        const _log = console.log;
        console.log = function (...rest) {
            window.parent.postMessage({
                type: constants_1.WEB_COMMAND_TYPE_RPC_LOGS,
                payload: rest,
            }, '*');
            _log.apply(console, rest);
        };
    }
    /**
     * Disabling logs.
     *
     * ```js
     * bridge
     *   .disableLogs()
     * ```
     */
    disableLogs() {
        this.logsEnabled = false;
    }
    /**
     * Enabling renaming event params from camelCase to snake_case and vice versa
     * ```js
     * bridge
     *    .enableRenameParams()
     * ```
     */
    enableRenameParams() {
        this.isRenameParamsEnabledForBotx = true;
        console.log('Bridge ~ Enabled renaming event params from camelCase to snake_case and vice versa');
    }
    /**
     * Enabling renaming event params from camelCase to snake_case and vice versa
     * ```js
     * bridge
     *    .disableRenameParams()
     * ```
     */
    disableRenameParams() {
        this.isRenameParamsEnabledForBotx = false;
        console.log('Bridge ~ Disabled renaming event params from camelCase to snake_case and vice versa');
    }
}
exports.default = WebBridge;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9wbGF0Zm9ybXMvd2ViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBaUM7QUFTakMsa0NBQW9FO0FBQ3BFLDRDQU9xQjtBQUNyQixtRUFBa0Q7QUFFbEQsTUFBTSxTQUFTO0lBTWI7UUFDRSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksc0JBQW9CLEVBQUUsQ0FBQTtRQUM5QyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQTtRQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtRQUN4QixJQUFJLENBQUMsNEJBQTRCLEdBQUcsSUFBSSxDQUFBO1FBQ3hDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBO0lBQ3JCLENBQUM7SUFFRCxpQkFBaUI7UUFDZixNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBbUIsRUFBUSxFQUFFO1lBQy9ELElBQ0UsT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVE7Z0JBQzlCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUTtnQkFDbkMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUTtnQkFFeEMsT0FBTTtZQUVSLE1BQU0sS0FJRixLQUFLLENBQUMsSUFBSSxFQUpSLEVBQ0osR0FBRyxPQUdTLEVBRlosWUFBMEIsRUFBMUIsRUFBUSxJQUFJLE9BQWMsRUFBVCxPQUFPLGNBQWxCLFFBQW9CLENBQUYsRUFGcEIsRUFHSixLQUFLLE9BQ08sQ0FBQTtZQUVkLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLE9BQU8sS0FBSyxtQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUE7WUFFdkcsSUFBSSxJQUFJ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