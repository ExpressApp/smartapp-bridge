import { v4 as uuid } from 'uuid';
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from '../case';
import { EVENT_TYPE, HANDLER, RESPONSE_TIMEOUT, WEB_COMMAND_TYPE, WEB_COMMAND_TYPE_RPC, WEB_COMMAND_TYPE_RPC_LOGS, } from '../constants';
import ExtendedEventEmitter from '../eventEmitter';
class WebBridge {
    eventEmitter;
    logsEnabled;
    isRenameParamsEnabledForBotx;
    handler;
    constructor() {
        this.eventEmitter = new ExtendedEventEmitter();
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
            const { ref, data: { type, ...payload }, files, } = event.data;
            const isRenameParamsEnabled = this.handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : false;
            if (this.logsEnabled)
                console.log('Bridge ~ Incoming event', event.data);
            const emitterType = ref || EVENT_TYPE.RECEIVE;
            const eventFiles = isRenameParamsEnabled ?
                files?.map((file) => snakeCaseToCamelCase(file)) : files;
            this.eventEmitter.emit(emitterType, {
                ref,
                type,
                payload: isRenameParamsEnabled ? snakeCaseToCamelCase(payload) : payload,
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
        this.eventEmitter.on(EVENT_TYPE.RECEIVE, callback);
    }
    sendEvent({ handler, method, params, files, timeout = RESPONSE_TIMEOUT, guaranteed_delivery_required = false, }) {
        const isRenameParamsEnabled = handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : false;
        const ref = uuid(); // UUID to detect express response.
        this.handler = handler;
        const payload = {
            ref,
            type: WEB_COMMAND_TYPE_RPC,
            method,
            handler,
            payload: isRenameParamsEnabled ? camelCaseToSnakeCase(params) : params,
            guaranteed_delivery_required,
        };
        const eventFiles = isRenameParamsEnabled ?
            files?.map((file) => camelCaseToSnakeCase(file)) : files;
        const event = files ? { ...payload, files: eventFiles } : payload;
        if (this.logsEnabled)
            console.log('Bridge ~ Outgoing event', event);
        window.parent.postMessage({
            type: WEB_COMMAND_TYPE,
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
            handler: HANDLER.BOTX,
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
            handler: HANDLER.EXPRESS,
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
                type: WEB_COMMAND_TYPE_RPC_LOGS,
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
export default WebBridge;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9wbGF0Zm9ybXMvd2ViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBU2pDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLFNBQVMsQ0FBQTtBQUNwRSxPQUFPLEVBQ0wsVUFBVSxFQUNWLE9BQU8sRUFDUCxnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUNwQix5QkFBeUIsR0FDMUIsTUFBTSxjQUFjLENBQUE7QUFDckIsT0FBTyxvQkFBb0IsTUFBTSxpQkFBaUIsQ0FBQTtBQUVsRCxNQUFNLFNBQVM7SUFDSSxZQUFZLENBQXNCO0lBQ25ELFdBQVcsQ0FBUztJQUNwQiw0QkFBNEIsQ0FBUztJQUNyQyxPQUFPLENBQWdCO0lBRXZCO1FBQ0UsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLG9CQUFvQixFQUFFLENBQUE7UUFDOUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUE7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUE7UUFDeEIsSUFBSSxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQTtRQUN4QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQTtJQUNyQixDQUFDO0lBRUQsaUJBQWlCO1FBQ2YsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQW1CLEVBQVEsRUFBRTtZQUMvRCxJQUNFLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRO2dCQUM5QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVE7Z0JBQ25DLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVE7Z0JBRXhDLE9BQU07WUFFUixNQUFNLEVBQ0osR0FBRyxF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