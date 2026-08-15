import assert from 'node:assert/strict'
import test from 'node:test'
import {toIso3166, unM49} from './index.js'

test('m49', function () {
  assert.ok(Array.isArray(unM49), 'should be an `array`')

  const ukraine = unM49.find((d) => d.code === '804')
  assert(ukraine)
  assert.deepEqual(
    ukraine,
    {
      type: 4,
      name: 'Ukraine',
      code: '804',
      iso3166: 'UKR',
      parent: '151'
    },
    'should include current entries without changing their shape'
  )

  const historical = [
    ['810', 'USSR', 'SUN'],
    ['200', 'Czechoslovakia', 'CSK'],
    ['278', 'German Democratic Republic', 'DDR'],
    ['890', 'Socialist Federal Republic of Yugoslavia', 'YUG']
  ]

  for (const [code, name, iso3166] of historical) {
    const entry = unM49.find((d) => d.code === code)
    assert(entry)
    assert.deepEqual(entry, {
      type: 4,
      name,
      code,
      iso3166,
      historical: true
    })
    assert.equal(toIso3166[code], iso3166)
  }

  const earlyEditions = [
    ['536', 'Neutral Zone', 'NTZ'],
    ['592', 'Panama Canal Zone', 'PCZ']
  ]

  for (const [code, name, iso3166] of earlyEditions) {
    const entry = unM49.find((d) => d.code === code)
    assert(entry)
    assert.deepEqual(entry, {
      type: 4,
      name,
      code,
      iso3166,
      historical: true
    })
    assert.equal(toIso3166[code], iso3166)
  }
})
