import { HANDLER } from '../lib/constants'

import { EmitterEventPayload, EventEmitterCallback } from './eventEmitter'

export type BridgeSendClientEventParams = {
  readonly method: string
  readonly params: object | undefined
  readonly timeout?: number
  readonly hide_send_event_data?: boolean
  readonly hide_recv_event_data?: boolean
}

export type BridgeSendBotEventParams = BridgeSendClientEventParams & {
  readonly files?: any
  readonly guaranteed_delivery_required?: boolean | undefined
  readonly sync_request?: boolean
  readonly sync_request_timeout?: number
  readonly hide_send_event_data?: boolean
  readonly hide_recv_event_data?: boolean
}

export type BridgeSendEventParams = BridgeSendClientEventParams &
  BridgeSendBotEventParams & {
  readonly handler: HANDLER
}

export interface Bridge {
  readonly onReceive: (callback: EventEmitterCallback) => void
  readonly sendBotEvent: (event: BridgeSendBotEventParams) => Promise<EmitterEventPayload>
  readonly sendClientEvent: (event: BridgeSendClientEventParams) => Promise<EmitterEventPayload>
  readonly disableRenameParams: () => void
  readonly enableRenameParams: () => void
  readonly enableLogs: () => void
  readonly disableLogs: () => void
  readonly log?: (data: string | object) => void
}

export type BridgeSendBotEvent = Omit<BridgeSendBotEventParams, 'params'> & {
  readonly ref: string
  readonly payload: object | undefined
}
