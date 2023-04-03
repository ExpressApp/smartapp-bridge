import { Bridge, BridgeSendBotEventParams, BridgeSendClientEventParams, EventEmitterCallback } from '../../types';
import { HANDLER } from '../constants';
declare class WebBridge implements Bridge {
    private readonly eventEmitter;
    logsEnabled: boolean;
    isRenameParamsEnabledForBotx: boolean;
    handler: HANDLER | null;
    constructor();
    addGlobalListener(): void;
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
    onReceive(callback: EventEmitterCallback): void;
    private sendEvent;
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
    sendBotEvent({ method, params, files, timeout, guaranteed_delivery_required, }: BridgeSendBotEventParams): Promise<import("../../types").EmitterEventPayload>;
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
    sendClientEvent({ method, params, timeout }: BridgeSendClientEventParams): Promise<import("../../types").EmitterEventPayload>;
    /**
     * Enabling logs.
     *
     * ```js
     * bridge
     *   .enableLogs()
     * ```
     */
    enableLogs(): void;
    /**
     * Disabling logs.
     *
     * ```js
     * bridge
     *   .disableLogs()
     * ```
     */
    disableLogs(): void;
    /**
     * Enabling renaming event params from camelCase to snake_case and vice versa
     * ```js
     * bridge
     *    .enableRenameParams()
     * ```
     */
    enableRenameParams(): void;
    /**
     * Enabling renaming event params from camelCase to snake_case and vice versa
     * ```js
     * bridge
     *    .disableRenameParams()
     * ```
     */
    disableRenameParams(): void;
}
export default WebBridge;
