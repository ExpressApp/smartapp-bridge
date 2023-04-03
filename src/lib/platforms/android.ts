import { v4 as uuid } from 'uuid'

import {
  Bridge,
  BridgeSendBotEventParams,
  BridgeSendClientEventParams,
  BridgeSendEventParams,
  EventEmitterCallback,
} from '../../types'
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from '../case'
import { EVENT_TYPE, HANDLER, RESPONSE_TIMEOUT, WEB_COMMAND_TYPE_RPC } from '../constants'
import ExtendedEventEmitter from '../eventEmitter'
import log from '../logger'

class AndroidBridge implements Bridge {
  private readonly eventEmitter: ExtendedEventEmitter
  private readonly hasCommunicationObject: boolean
  logsEnabled: boolean
  isRenameParamsEnabledForBotx: boolean
  handler: HANDLER | null

  constructor() {
    this.hasCommunicationObject = typeof window.express !== 'undefined' && !!window.express.handleSmartAppEvent
    this.eventEmitter = new ExtendedEventEmitter()
    this.logsEnabled = false
    this.isRenameParamsEnabledForBotx = true
    this.handler = null

    if (!this.hasCommunicationObject) {
      log('No method "express.handleSmartAppEvent", cannot send message to Android')
      return
    }

    // Expect json data as string
    window.handleAndroidEvent = (
      {
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
      if (this.logsEnabled)
        console.log(
          'Bridge ~ Incoming event',
          JSON.stringify({ ref, data, files }, null, 2),
        )

      const { type, ...payload } = data

      const emitterType = ref || EVENT_TYPE.RECEIVE

      const isRenameParamsEnabled = this.handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : true
      const eventFiles = isRenameParamsEnabled ?
        files?.map((file: any) => snakeCaseToCamelCase(file)) : files

      const event = {
        ref,
        type,
        payload: isRenameParamsEnabled ? snakeCaseToCamelCase(payload) : payload,
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

  private sendEvent(
    {
      handler,
      method,
      params,
      files,
      timeout = RESPONSE_TIMEOUT,
      guaranteed_delivery_required = false,
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
    }

    const eventFiles = isRenameParamsEnabled ?
      files?.map((file: any) => camelCaseToSnakeCase(file)) : files

    const event = JSON.stringify(
      files ? { ...eventParams, files: eventFiles } : eventParams,
    )

    if (this.logsEnabled) console.log('Bridge ~ Outgoing event', JSON.stringify(event, null, '  '))

    window.express.handleSmartAppEvent(event)

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
   * @returns Promise.
   */
  sendBotEvent(
    {
      method,
      params,
      files,
      timeout,
      guaranteed_delivery_required,
    }: BridgeSendBotEventParams,
  ) {
    return this.sendEvent({
      handler: HANDLER.BOTX,
      method,
      params,
      files,
      timeout,
      guaranteed_delivery_required,
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
  sendClientEvent({ method, params, timeout }: BridgeSendClientEventParams) {
    return this.sendEvent({ handler: HANDLER.EXPRESS, method, params, timeout })
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
    this.logsEnabled = true
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
    this.logsEnabled = false
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
    if (
      (!this.hasCommunicationObject || !data) ||
      (typeof data !== 'string' && typeof data !== 'object')
    ) return

    window.express.handleSmartAppEvent(
      JSON.stringify({ 'SmartApp Log': data }, null, 2),
    )
  }
}

export default AndroidBridge
