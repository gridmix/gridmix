const { log, info, warn, error } = require('../log')
const ANSI_ESCAPE = require('../../../../test-utils/ansi-escape-regexp')

describe('log utilities', () => {
  let gridmixTest

  beforeEach(() => {
    gridmixTest = process.env.GRIDMIX_TEST
    delete process.env.GRIDMIX_TEST
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (gridmixTest === undefined) {
      delete process.env.GRIDMIX_TEST
    } else {
      process.env.GRIDMIX_TEST = gridmixTest
    }

    jest.restoreAllMocks()
  })

  test('log writes unstyled messages', () => {
    log('hello')

    expect(console.log).toHaveBeenCalledWith('hello')
  })

  test('info applies dim styling', () => {
    info('hello')

    expect(console.info).toHaveBeenCalledWith(expect.stringMatching(ANSI_ESCAPE))
  })

  test('warn applies yellow styling', () => {
    warn('hello', 'gridmix')

    expect(console.warn).toHaveBeenCalledWith(
      'gridmix',
      '>',
      expect.stringMatching(ANSI_ESCAPE)
    )
  })

  test('error applies red styling', () => {
    error('hello')

    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(ANSI_ESCAPE))
  })

  test('does not write output while GRIDMIX_TEST is set', () => {
    process.env.GRIDMIX_TEST = 'unit'

    log('hello')
    warn('hello')

    expect(console.log).not.toHaveBeenCalled()
    expect(console.warn).not.toHaveBeenCalled()
  })
})
