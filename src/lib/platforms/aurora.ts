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

class AuroraBridge extends Logger implements Bridge {
  private readonly eventEmitter: ExtendedEventEmitter
  isRenameParamsEnabledForBotx: boolean

  constructor() {
    super()

    this.eventEmitter = new ExtendedEventEmitter()
    this.isRenameParamsEnabledForBotx = true
    window.handleAuroraEvent = this.handleAuroraEvent.bind(this)
  }

  private handleAuroraEvent({
    ref,
    data,
    files,
  }: {
    readonly ref: string
    readonly data: {
      readonly type: string
    }
    readonly files: any
  }): void {
    this.logRecvEvent({ ref, data, files })

    const { type, ...payload } = data

    const emitterType = ref || EVENT_TYPE.RECEIVE

    const eventFiles = this.isRenameParamsEnabledForBotx ? files?.map((file: any) => snakeCaseToCamelCase(file)) : files

    const event = {
      ref,
      type,
      payload: this.isRenameParamsEnabledForBotx ? snakeCaseToCamelCase(payload) : payload,
      files: eventFiles,
    }

    this.eventEmitter.emit(emitterType, event)
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
    const ref = uuid() // UUID to detect express response.
    const isRenameParamsEnabled = handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : true
    const eventProps = {
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

    const event = files ? { ...eventProps, files: eventFiles } : eventProps

    this.logSendEvent(event)

    const customEvent = new CustomEvent('framescript:action', { detail: event })

    if (window.sendAsyncMessage) {
      window.sendAsyncMessage('webview:action', JSON.stringify(event))
    } else {
      document.dispatchEvent(customEvent)
    }

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
   */
  sendBotEvent({
    method,
    params,
    files,
    timeout = RESPONSE_TIMEOUT,
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
   */
  sendClientEvent({
    method,
    params,
    timeout = RESPONSE_TIMEOUT,
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

  /**
   * Write log to client
   * @param data Any data to log
   */
  log(data: string | object): void {
    let value: typeof data = ''
    if (typeof data === 'string') {
      value = data
    } else if (typeof data === 'object') {
      value = JSON.stringify(data, null, 2)
    } else return

    const event = new CustomEvent('framescript:action', { detail: { 'SmartApp Log': value } })
    document.dispatchEvent(event)
  }
}

export default AuroraBridge
