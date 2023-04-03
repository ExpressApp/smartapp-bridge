import { v4 as uuid } from 'uuid';
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from '../case';
import { EVENT_TYPE, HANDLER, RESPONSE_TIMEOUT, WEB_COMMAND_TYPE_RPC } from '../constants';
import ExtendedEventEmitter from '../eventEmitter';
import log from '../logger';
class IosBridge {
    eventEmitter;
    hasCommunicationObject;
    logsEnabled;
    isRenameParamsEnabledForBotx;
    handler;
    constructor() {
        this.hasCommunicationObject =
            window.webkit &&
                window.webkit.messageHandlers &&
                window.webkit.messageHandlers.express &&
                !!window.webkit.messageHandlers.express.postMessage;
        this.eventEmitter = new ExtendedEventEmitter();
        this.logsEnabled = false;
        this.isRenameParamsEnabledForBotx = true;
        this.handler = null;
        if (!this.hasCommunicationObject) {
            log('No method "express.postMessage", cannot send message to iOS');
            return;
        }
        // Expect json data as string
        window.handleIosEvent = ({ ref, data, files, }) => {
            if (this.logsEnabled)
                console.log('Bridge ~ Incoming event', JSON.stringify({ ref, data, files }, null, 2));
            const { type, ...payload } = data;
            const emitterType = ref || EVENT_TYPE.RECEIVE;
            const isRenameParamsEnabled = this.handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : true;
            const eventFiles = isRenameParamsEnabled ?
                files?.map((file) => snakeCaseToCamelCase(file)) : files;
            const event = {
                ref,
                type,
                payload: isRenameParamsEnabled ? snakeCaseToCamelCase(payload) : payload,
                files: eventFiles,
            };
            this.eventEmitter.emit(emitterType, event);
        };
    }
    /**
     * Set callback function to handle events without **ref**
     * (notifications for example).
     *
     * ```js
     * bridge.onRecieve(({ type, handler, payload }) => {
     *   // Handle event data
     *   console.log('event', type, handler, payload)
     * })
     * ```
     */
    onReceive(callback) {
        this.eventEmitter.on(EVENT_TYPE.RECEIVE, callback);
    }
    sendEvent({ handler, method, params, files, timeout = RESPONSE_TIMEOUT, guaranteed_delivery_required = false, }) {
        if (!this.hasCommunicationObject)
            return Promise.reject();
        const ref = uuid(); // UUID to detect express response.
        this.handler = handler;
        const isRenameParamsEnabled = handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : true;
        const eventProps = {
            ref,
            type: WEB_COMMAND_TYPE_RPC,
            method,
            handler,
            payload: isRenameParamsEnabled ? camelCaseToSnakeCase(params) : params,
            guaranteed_delivery_required,
        };
        const eventFiles = isRenameParamsEnabled ?
            files?.map((file) => camelCaseToSnakeCase(file)) : files;
        const event = files ? { ...eventProps, files: eventFiles } : eventProps;
        if (this.logsEnabled)
            console.log('Bridge ~ Outgoing event', JSON.stringify(event, null, '  '));
        window.webkit.messageHandlers.express.postMessage(event);
        return this.eventEmitter.onceWithTimeout(ref, timeout);
    }
    /**
     * Send event and wait response from express client.
     *
     * ```js
     * bridge
     *   .sendBotEvent(
     *     {
     *       method: 'get_weather',
     *       params: {
     *         city: 'Moscow',
     *       },
     *       files: []
     *     }
     *   )
     *   .then(data => {
     *     // Handle response
     *     console.log('response', data)
     *   })
     * ```
     */
    sendBotEvent({ method, params, files, timeout = RESPONSE_TIMEOUT, guaranteed_delivery_required, }) {
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
     *       type: 'get_weather',
     *       handler: 'express',
     *       payload: {
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
    sendClientEvent({ method, params, timeout = RESPONSE_TIMEOUT, }) {
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
    log(data) {
        if (!this.hasCommunicationObject || !data)
            return;
        let value = '';
        if (typeof data === 'string') {
            value = data;
        }
        else if (typeof data === 'object') {
            value = JSON.stringify(data, null, 2);
        }
        else
            return;
        window.webkit.messageHandlers.express.postMessage({ 'SmartApp Log': value });
    }
}
export default IosBridge;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW9zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9wbGF0Zm9ybXMvaW9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBU2pDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLFNBQVMsQ0FBQTtBQUNwRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGNBQWMsQ0FBQTtBQUMxRixPQUFPLG9CQUFvQixNQUFNLGlCQUFpQixDQUFBO0FBQ2xELE9BQU8sR0FBRyxNQUFNLFdBQVcsQ0FBQTtBQUUzQixNQUFNLFNBQVM7SUFDSSxZQUFZLENBQXNCO0lBQ2xDLHNCQUFzQixDQUFTO0lBQ2hELFdBQVcsQ0FBUztJQUNwQiw0QkFBNEIsQ0FBUztJQUNyQyxPQUFPLENBQWdCO0lBRXZCO1FBQ0UsSUFBSSxDQUFDLHNCQUFzQjtZQUN6QixNQUFNLENBQUMsTUFBTTtnQkFDYixNQUFNLENBQUMsTUFBTSxDQUFDLGVBQWU7Z0JBQzdCLE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU87Z0JBQ3JDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFBO1FBQ3JELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxvQkFBb0IsRUFBRSxDQUFBO1FBQzlDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO1FBQ3hCLElBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLENBQUE7UUFDeEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUE7UUFFbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUNoQyxHQUFHLENBQUMsNkRBQTZELENBQUMsQ0FBQTtZQUNsRSxPQUFNO1NBQ1A7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