import { v4 as uuid } from 'uuid'

import {
  Bridge,
  BridgeSendBotEventParams,
  BridgeSendClientEventParams,
  BridgeSendEventParams,
  EventEmitterCallback,
} from '../../types'
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from '../case'
import { EVENT_TYPE, HANDLER, RESPONSE_TIMEOUT, SYNC_RESPONSE_TIMEOUT, WEB_COMMAND_TYPE_RPC } from '../constants'
import ExtendedEventEmitter from '../eventEmitter'
import Logger from '../logger'

class AndroidBridge extends Logger implements Bridge {
  private readonly eventEmitter: ExtendedEventEmitter
  private readonly hasCommunicationObject: boolean
  isRenameParamsEnabledForBotx: boolean

  constructor() {
    super()

    this.hasCommunicationObject = typeof window.express !== 'undefined' && !!window.express.handleSmartAppEvent
    this.eventEmitter = new ExtendedEventEmitter()
    this.isRenameParamsEnabledForBotx = true

    if (!this.hasCommunicationObject) {
      this.alert('No method "express.handleSmartAppEvent", cannot send message to Android')
      return
    }

    // Expect json data as string
    window.handleAndroidEvent = ({
      ref,
      data,
      files,
    }: {
      readonly ref: string
      readonly data: {
        readonly type: string
      }
      readonly files: any
    }): void => {
      this.logRecvEvent({ ref, data, files })

      const { type, ...payload } = data

      const emitterType = ref || EVENT_TYPE.RECEIVE

      // const isRenameParamsEnabled = data.handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : true // TODO uncomment when client is ready
      const eventFiles = this.isRenameParamsEnabledForBotx
        ? files?.map((file: any) => snakeCaseToCamelCase(file))
        : files

      const event = {
        ref,
        type,
        payload: this.isRenameParamsEnabledForBotx ? snakeCaseToCamelCase(payload) : payload,
        files: eventFiles,
      }

      this.eventEmitter.emit(emitterType, event)
    }
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
  onReceive(callback: EventEmitterCallback) {
    this.eventEmitter.on(EVENT_TYPE.RECEIVE, callback)
  }

  private sendEvent({
    handler,
    method,
    params,
    files,
    timeout = RESPONSE_TIMEOUT,
    guaranteed_delivery_required = false,
    sync_request = false,
    sync_request_timeout = SYNC_RESPONSE_TIMEOUT,
    hide_send_event_data = false,
    hide_recv_event_data = false,
  }: BridgeSendEventParams) {
    if (!this.hasCommunicationObject) return Promise.reject()
    const isRenameParamsEnabled = handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : true

    const ref = uuid() // UUID to detect express response.
    const eventParams = {
      ref,
      type: WEB_COMMAND_TYPE_RPC,
      method,
      handler,
      payload: isRenameParamsEnabled ? camelCaseToSnakeCase(params) : params,
      guaranteed_delivery_required,
      sync_request,
      sync_request_timeout,
      hide_send_event_data,
      hide_recv_event_data,
    }

    const eventFiles = isRenameParamsEnabled ? files?.map((file: any) => camelCaseToSnakeCase(file)) : files

    const event = files ? { ...eventParams, files: eventFiles } : eventParams

    this.logSendEvent(event)

    window.express.handleSmartAppEvent(JSON.stringify(event))

    return this.eventEmitter.onceWithTimeout(ref, timeout)
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
   * @param sync_request - boolean, default false
   * @param sync_request_timeout - number
   * @param hide_send_event_data - boolean, default false
   * @param hide_recv_event_data - boolean, default false
   * @returns Promise.
   */
  sendBotEvent({
    method,
    params,
    files,
    timeout,
    guaranteed_delivery_required,
    sync_request,
    sync_request_timeout,
    hide_send_event_data,
    hide_recv_event_data,
  }: BridgeSendBotEventParams) {
    return this.sendEvent({
      handler: HANDLER.BOTX,
      method,
      params,
      files,
      timeout,
      guaranteed_delivery_required,
      sync_request,
      sync_request_timeout,
      hide_send_event_data,
      hide_recv_event_data,
    })
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
  sendClientEvent({
    method,
    params,
    timeout,
    hide_send_event_data,
    hide_recv_event_data,
  }: BridgeSendClientEventParams) {
    return this.sendEvent({
      handler: HANDLER.EXPRESS,
      method,
      params,
      timeout,
      hide_send_event_data,
      hide_recv_event_data,
    })
  }

  /**
   * Enabling renaming event params from camelCase to snake_case and vice versa
   * ```js
   * bridge
   *    .enableRenameParams()
   * ```
   */
  enableRenameParams() {
    this.isRenameParamsEnabledForBotx = true
    console.log('Bridge ~ Enabled renaming event params from camelCase to snake_case and vice versa')
  }

  /**
   * Enabling renaming event params from camelCase to snake_case and vice versa
   * ```js
   * bridge
   *    .disableRenameParams()
   * ```
   */
  disableRenameParams() {
    this.isRenameParamsEnabledForBotx = false
    console.log('Bridge ~ Disabled renaming event params from camelCase to snake_case and vice versa')
  }

  log(data: string | object) {
    if (!this.hasCommunicationObject) return
    if (!data || (typeof data !== 'string' && typeof data !== 'object')) return

    window.express.handleSmartAppEvent(JSON.stringify({ 'SmartApp Log': data }, null, 2))
  }
}

export default AndroidBridge
