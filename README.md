# SmartApp bridge library

This library provides a universal interface for exchanging events with an express client.
Andriod, iOS, Aurora and Web clients supported.

All types can be found [here](https://smartapp.ccsteam.xyz/smartapp-bridge/).

### Send event to eXpress

```js
SmartAppBridge
  .sendClientEvent(
    {
      method: 'get_weather',
      params: {
        city: 'Moscow',
      },
      files: []
    }
  )
  .then(data => {
    // Handle response
    console.log('response', data)
  })
  .then(({ type: method, handler: express, payload: params, files }) => {
    // Handle response data type, payload
  })
  .catch(() => {
    // Do something on timeout
  })
```

```js
SmartAppBridge
  .sendBotEvent(
    {
      method: 'get_weather',
      params: {
        city: 'Moscow',
      },
    }
  )
  .then(data => {
    // Handle response
    console.log('response', data)
  })
  .then(({ type: method, handler: botx, payload: params }) => {
    // Handle response data type, payload
  })
  .catch(() => {
    // Do something on timeout
  })
```

### Receive event from eXpress
```js
SmartAppBridge.onRecieve(({ type, payload }) => {
  // This callback triggers when eXpress client send data without ref
})
```

### Enable/Disable renaming event params from camelCase to snake_case and vice versa
- Params are renamed from camelCase to snake_case and vice versa by default
- Call after sending `ready` event

```js
SmartAppBridge.disableRenameParams()
```

```js
SmartAppBridge.enableRenameParams()
```

### Enable/disable logging smart app events

```js
SmartAppBridge.enableLogs()
```

```js
SmartAppBridge.disableLogs()
```

### Logging via bridge on mobile devices
- log your data inside a smart app:
```typescript
  import { Bridge as bridge } from '@unlimited/smartapp-bridge'

  const data: string | value = { logs: 'test' }
  bridge?.log?.(data)
```
- Search in mobile logs by 'SmartApp Log' string

```js
SmartAppBridge?.log?.(data)
```
