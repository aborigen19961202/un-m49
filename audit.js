import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import crypto from 'node:crypto'
import process from 'node:process'
import fetch from 'node-fetch'
import {provenance} from './historical-provenance.js'
import {unM49} from './index.js'
/** @type {Set<string>} */
const sourceIds = new Set()

assert.equal(provenance.schemaVersion, 1)
assert.equal(provenance.sources.length, 5, 'expected all five UN M49 editions')

for (const source of provenance.sources) {
  assert.match(source.id, /^m49-\d{4}$/)
  assert.match(source.url, /^https:\/\/unstats\.un\.org\//)
  assert.match(source.sha256, /^[a-f\d]{64}$/)
  assert(
    !sourceIds.has(source.id),
    'expected unique source id `' + source.id + '`'
  )
  sourceIds.add(source.id)
}

if (process.argv.includes('--fetch')) {
  await Promise.all(
    provenance.sources.map(async (source) => {
      const response = await fetch(source.url)
      assert(response.ok, 'expected source to load: ' + source.url)
      const hash = crypto
        .createHash('sha256')
        .update(Buffer.from(await response.arrayBuffer()))
        .digest('hex')
      assert.equal(hash, source.sha256, 'source changed: ' + source.url)
    })
  )
}

const runtimeByCode = new Map(unM49.map((entry) => [entry.code, entry]))
assert.equal(runtimeByCode.size, unM49.length, 'expected unique runtime codes')
/** @type {Set<string>} */
const supplementalCodes = new Set()

for (const expected of provenance.supplementalEntries) {
  assert.match(expected.code, /^\d{3}$/)
  assert.equal(expected.type, 4)
  assert.equal(expected.historical, true)
  assert(
    !supplementalCodes.has(expected.code),
    'duplicate `' + expected.code + '`'
  )
  supplementalCodes.add(expected.code)

  for (const reference of expected.sources) {
    assert(
      sourceIds.has(reference.source),
      'unknown source `' + reference.source + '`'
    )
    assert(Number.isInteger(reference.page) && reference.page > 0)
  }

  const {sources, ...runtimeExpected} = expected
  assert.deepEqual(runtimeByCode.get(expected.code), runtimeExpected)
}

for (const reused of provenance.reusedCodes) {
  assert.match(reused.code, /^\d{3}$/)
  for (const reference of reused.sources) {
    assert(
      sourceIds.has(reference.source),
      'unknown source `' + reference.source + '`'
    )
    assert(Number.isInteger(reference.page) && reference.page > 0)
  }

  const current = runtimeByCode.get(reused.code)
  assert(current, 'expected current reused code `' + reused.code + '`')
  assert.equal(current.name, reused.currentName)
  assert.equal(current.historical, undefined)
}

const currentCount = unM49.filter((entry) => !entry.historical).length
const historicalCount = unM49.length - currentCount

console.log(
  JSON.stringify(
    {
      sources: provenance.sources.length,
      currentEntries: currentCount,
      historicalEntries: historicalCount,
      supplementalEntries: supplementalCodes.size,
      reusedCodesNotEmitted: provenance.reusedCodes.length
    },
    null,
    2
  )
)
