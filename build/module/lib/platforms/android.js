import { v4 as uuid } from 'uuid';
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from '../case';
import { EVENT_TYPE, HANDLER, RESPONSE_TIMEOUT, WEB_COMMAND_TYPE_RPC } from '../constants';
import ExtendedEventEmitter from '../eventEmitter';
import log from '../logger';
class AndroidBridge {
    eventEmitter;
    hasCommunicationObject;
    logsEnabled;
    isRenameParamsEnabledForBotx;
    handler;
    constructor() {
        this.hasCommunicationObject = typeof window.express !== 'undefined' && !!window.express.handleSmartAppEvent;
        this.eventEmitter = new ExtendedEventEmitter();
        this.logsEnabled = false;
        this.isRenameParamsEnabledForBotx = true;
        this.handler = null;
        if (!this.hasCommunicationObject) {
            log('No method "express.handleSmartAppEvent", cannot send message to Android');
            return;
        }
        // Expect json data as string
        window.handleAndroidEvent = ({ ref, data, files, }) => {
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
     * bridge.onReceive(({ type, handler, payload }) => {
     *   // Handle event data
     *   console.log('event', type, handler, payload)
     * })
     * ```
     * @param callback - Callback function.
     */
    onReceive(callback) {
        this.eventEmitter.on(EVENT_TYPE.RECEIVE, callback);
    }
    sendEvent({ handler, method, params, files, timeout = RESPONSE_TIMEOUT, guaranteed_delivery_required = false, }) {
        if (!this.hasCommunicationObject)
            return Promise.reject();
        const isRenameParamsEnabled = handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : true;
        const ref = uuid(); // UUID to detect express response.
        const eventParams = {
            ref,
            type: WEB_COMMAND_TYPE_RPC,
            method,
            handler,
            payload: isRenameParamsEnabled ? camelCaseToSnakeCase(params) : params,
            guaranteed_delivery_required,
        };
        const eventFiles = isRenameParamsEnabled ?
            files?.map((file) => camelCaseToSnakeCase(file)) : files;
        const event = JSON.stringify(files ? { ...eventParams, files: eventFiles } : eventParams);
        if (this.logsEnabled)
            console.log('Bridge ~ Outgoing event', JSON.stringify(event, null, '  '));
        window.express.handleSmartAppEvent(event);
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
     * @param method - Event type.
     * @param params
     * @param files
     * @param timeout - Timeout in ms.
     * @param guaranteed_delivery_required - boolean.
     * @returns Promise.
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
     * @param method - Event type.
     * @param params
     * @param timeout - Timeout in ms.
     * @returns Promise.
     */
    sendClientEvent({ method, params, timeout }) {
        return this.sendEvent({ handler: HANDLER.EXPRESS, method, params, timeout });
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
        if ((!this.hasCommunicationObject || !data) ||
            (typeof data !== 'string' && typeof data !== 'object'))
            return;
        window.express.handleSmartAppEvent(JSON.stringify({ 'SmartApp Log': data }, null, 2));
    }
}
export default AndroidBridge;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5kcm9pZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcGxhdGZvcm1zL2FuZHJvaWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsTUFBTSxNQUFNLENBQUE7QUFTakMsT0FBTyxFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLE1BQU0sU0FBUyxDQUFBO0FBQ3BFLE9BQU8sRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLE1BQU0sY0FBYyxDQUFBO0FBQzFGLE9BQU8sb0JBQW9CLE1BQU0saUJBQWlCLENBQUE7QUFDbEQsT0FBTyxHQUFHLE1BQU0sV0FBVyxDQUFBO0FBRTNCLE1BQU0sYUFBYTtJQUNBLFlBQVksQ0FBc0I7SUFDbEMsc0JBQXNCLENBQVM7SUFDaEQsV0FBVyxDQUFTO0lBQ3BCLDRCQUE0QixDQUFTO0lBQ3JDLE9BQU8sQ0FBZ0I7SUFFdkI7UUFDRSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsT0FBTyxNQUFNLENBQUMsT0FBTyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQTtRQUMzRyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksb0JBQW9CLEVBQUUsQ0FBQTtRQUM5QyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtRQUN4QixJQUFJLENBQUMsNEJBQTRCLEdBQUcsSUFBSSxDQUFBO1FBQ3hDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBO1FBRW5CLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDaEMsR0FBRyxDQUFDLHlFQUF5RSxDQUFDLENBQUE7WUFDOUUsT0FBTTtTQUNQO1FBRUQsNkJBQTZCO1FBQzdCLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxDQUMxQixFQUNFLEdBQUcsRUFDSCxJQUFJLEVBQ0os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