// Custom Jest test environment. Extends jest-environment-node to forward Web
// Platform globals from the host runtime into the per-file vm context. The
// stock environment shipped with Jest 27 only injects URL, Buffer,
// TextEncoder, etc.; tests that transitively load `undici@7` (via `cheerio`)
// fail at require time with `ReferenceError: ReadableStream is not defined`
// (then `File`, `DOMException`, …). Upgrading Jest is the proper fix, but
// pinning these globals here keeps the migration to pnpm self-contained.
const NodeEnvironment = require('jest-environment-node')

const HostEnvironment = NodeEnvironment.default || NodeEnvironment

class GridmixTestEnvironment extends HostEnvironment {
  async setup () {
    await super.setup()

    const g = this.global

    const forward = (name, value) => {
      if (typeof g[name] === 'undefined' && typeof value !== 'undefined') {
        g[name] = value
      }
    }

    // Names that exist on Node's host globalThis but are not copied into the
    // vm sandbox by jest-environment-node@27.
    for (const name of [
      'fetch',
      'Request',
      'Response',
      'Headers',
      'FormData',
      'AbortController',
      'AbortSignal',
      'Event',
      'EventTarget',
      'CustomEvent',
      'MessageEvent',
      'DOMException',
      'WebSocket',
      'structuredClone',
      'queueMicrotask'
    ]) {
      forward(name, globalThis[name])
    }

    // Web streams.
    const streams = require('node:stream/web')
    for (const name of [
      'ReadableStream',
      'ReadableStreamDefaultReader',
      'ReadableStreamBYOBReader',
      'ReadableStreamBYOBRequest',
      'ReadableByteStreamController',
      'ReadableStreamDefaultController',
      'WritableStream',
      'WritableStreamDefaultController',
      'WritableStreamDefaultWriter',
      'TransformStream',
      'TransformStreamDefaultController',
      'ByteLengthQueuingStrategy',
      'CountQueuingStrategy',
      'TextEncoderStream',
      'TextDecoderStream',
      'CompressionStream',
      'DecompressionStream'
    ]) {
      forward(name, streams[name])
    }

    // Blob & File.
    const buf = require('node:buffer')
    forward('Blob', buf.Blob)
    forward('File', buf.File)

    // Worker primitives.
    const worker = require('node:worker_threads')
    forward('MessagePort', worker.MessagePort)
    forward('MessageChannel', worker.MessageChannel)
    forward('BroadcastChannel', worker.BroadcastChannel)

    // Performance.
    const perf = require('node:perf_hooks')
    forward('performance', perf.performance)
    forward('Performance', perf.Performance)
    forward('PerformanceEntry', perf.PerformanceEntry)
    forward('PerformanceMark', perf.PerformanceMark)
    forward('PerformanceMeasure', perf.PerformanceMeasure)
    forward('PerformanceObserver', perf.PerformanceObserver)
    forward('PerformanceObserverEntryList', perf.PerformanceObserverEntryList)
    forward('PerformanceResourceTiming', perf.PerformanceResourceTiming)

    // Web crypto.
    const cryptoMod = require('node:crypto')
    forward('crypto', cryptoMod.webcrypto)
    forward('Crypto', globalThis.Crypto)
    forward('SubtleCrypto', globalThis.SubtleCrypto)
    forward('CryptoKey', globalThis.CryptoKey)
  }
}

module.exports = GridmixTestEnvironment
