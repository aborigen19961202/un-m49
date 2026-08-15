/**
 * @typedef {0|1|2|3|4} Type
 *   *   `0` — Global (example: `001` `World`)
 *   *   `1` — Region (example: `002` `Africa`)
 *   *   `2` — Subregion (example: `202` `Sub-Saharan Africa`)
 *   *   `3` — Intermediate region (example: `017` `Middle Africa`)
 *   *   `4` — Country or area (example: `024` `Angola`)
 *
 * @typedef UNM49
 *   Region.
 * @property {Type} type
 *   Type of region (example: `4`).
 * @property {string} name
 *   Name of region (example: `'United Kingdom of Great Britain and Northern Ireland'`).
 * @property {string} code
 *   Three-character UN M49 code (example: `826`).
 * @property {string|undefined} [iso3166]
 *   ISO 3166-1 alpha-3 code, if `type` represents a country or area (example: `'GBR'`).
 * @property {string|undefined} [parent]
 *   Code of parent region, if `type` does not represent the planet (example: `'154'`).
 * @property {true|undefined} [historical]
 *   Whether this code is retired or no longer in current use.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import fetch from 'node-fetch'
import {fromHtml} from 'hast-util-from-html'
import {select, selectAll} from 'hast-util-select'
import {toString} from 'hast-util-to-string'
import {provenance} from './historical-provenance.js'

/** @type {Record<string, string>} */
const headerToField = {
  'Global Code': 'global',
  'Global Name': 'globalName',
  'Region Code': 'region',
  'Region Name': 'regionName',
  'Sub-region Code': 'subregion',
  'Sub-region Name': 'subregionName',
  'Intermediate Region Code': 'intermediate',
  'Intermediate Region Name': 'intermediateName',
  'Country or Area': 'areaName',
  'M49 Code': 'area',
  'ISO-alpha2 Code': 'iso3166Alpha2',
  'ISO-alpha3 Code': 'iso3166',
  'Least Developed Countries (LDC)': 'ldc',
  'Land Locked Developing Countries (LLDC)': 'lldc',
  'Small Island Developing States (SIDS)': 'sids',
  'Developed / Developing Countries': 'status'
}

// From big to small:
const types = ['global', 'region', 'subregion', 'intermediate', 'area']
const overview = 'https://unstats.un.org/unsd/methodology/m49/overview/'
const methodology = 'https://unstats.un.org/unsd/methodology/m49/'

const [overviewResponse, methodologyResponse] = await Promise.all([
  fetch(overview),
  fetch(methodology)
])
assert(overviewResponse.ok, 'expected UN M49 overview to load')
assert(methodologyResponse.ok, 'expected UN M49 methodology to load')
const tree = await fromHtml(await overviewResponse.text())
const methodologyTree = await fromHtml(await methodologyResponse.text())

const table = select('#downloadTableEN', tree)
assert(table, 'expected table to exist')
const headers = selectAll('thead td', table).map((d) => toString(d).trim())
const rows = selectAll('tbody tr', table)

const fields = headers.map((d) => {
  assert(d in headerToField, 'expected known column, not `' + d + '`')
  return headerToField[d]
})

const records = rows.map((row) => {
  /** @type {Record<string, string|boolean>} */
  const record = {}
  const cells = selectAll('td', row)
  let index = -1

  while (++index < cells.length) {
    const field = fields[index]
    /** @type {string|boolean} */
    let value = toString(cells[index]).trim()
    assert(field, 'expected known cell, not `' + value + '`')

    if (field === 'ldc' || field === 'lldc' || field === 'sids') {
      value = /^x$/i.test(value)
    }

    record[field] = value
  }

  return record
})

/** @type {Record<string, UNM49 & {stack: Array<string>}>} */
const byCode = {}
let index = -1

while (++index < records.length) {
  const record = records[index]
  /** @type {Array<string>} */
  const stack = []
  let kind = -1

  while (++kind < types.length) {
    const prefix = types[kind]
    const code = record[prefix]
    const name = record[prefix + 'Name']

    // Sometimes, intermediate sizes aren’t available (e.g., for Antarctica).
    if (!code || !name) {
      continue
    }

    assert(typeof code === 'string', 'expected `' + code + '` to be a string')
    assert(typeof name === 'string', 'expected `' + name + '` to be a string')

    if (code in byCode) {
      byCode[code].stack = Object.assign([], byCode[code].stack, stack)
    } else {
      byCode[code] = {
        // @ts-expect-error: `kind` is a correct type.
        type: kind,
        name,
        code,
        iso3166:
          prefix === 'area' && typeof record.iso3166 === 'string'
            ? record.iso3166
            : undefined,
        stack: stack.concat()
      }
    }

    stack[kind] = code
  }
}

// ISO alpha-3 codes published in the official UN M49 revisions.  Older
// revisions 1 and 2 are scans, so keeping this small transcription here makes
// generation deterministic instead of depending on OCR.  Revision 4 supplies
// later assignments such as ANT; subsequent UN nomenclature supplies SCG.
//
// https://unstats.un.org/unsd/publication/SeriesM/Series_M49_Rev1%281975%29_en.pdf
// https://unstats.un.org/unsd/publication/SeriesM/Series_M49_Rev2%281982%29_en.pdf
// https://unstats.un.org/unsd/publication/SeriesM/Series_M49_Rev4%281999%29_en.pdf
/** @type {Record<string, string>} */
const historicalIso3166 = {
  128: 'CTE',
  200: 'CSK',
  230: 'ETH',
  278: 'DDR',
  280: 'DEU',
  396: 'JTN',
  488: 'MID',
  530: 'ANT',
  532: 'ANT',
  582: 'PCI',
  720: 'YMD',
  736: 'SDN',
  810: 'SUN',
  849: 'PUS',
  872: 'WAK',
  886: 'YEM',
  890: 'YUG',
  891: 'SCG'
}

for (const heading of [
  'Codes not in current use since 1982:',
  'Removed from the M49 numerical code list'
]) {
  const nodes = selectAll('h4, table', methodologyTree)
  const headingIndex = nodes.findIndex(
    (node) => node.tagName === 'h4' && toString(node).trim() === heading
  )
  assert(headingIndex >= 0, 'expected historical heading `' + heading + '`')
  const historicalTable = nodes[headingIndex + 1]
  assert(
    historicalTable && historicalTable.tagName === 'table',
    'expected historical table after `' + heading + '`'
  )

  for (const row of selectAll('tbody tr', historicalTable)) {
    const cells = selectAll('td', row)
    if (cells.length === 0) {
      continue
    }

    assert(cells.length >= 2, 'expected historical code and name')
    const codeText = toString(cells[0]).trim()
    const name = toString(cells[1])
      .trim()
      .replace(/ \(now \d{3}\)$/, '')
    const historicalCodes = codeText.match(/\d{3}/g)
    assert(
      historicalCodes,
      'expected historical M49 code in `' + codeText + '`'
    )

    for (const code of historicalCodes) {
      assert(!(code in byCode), 'expected historical code `' + code + '`')
      byCode[code] = {
        type: code === '062' ? 2 : 4,
        name,
        code,
        iso3166: historicalIso3166[code],
        historical: true,
        stack: []
      }
    }
  }
}

// The current UN methodology page does not contain every retired code from
// the five official M49 editions.  Add the non-conflicting omissions from the
// audited provenance manifest instead of editing generated output.
for (const supplemental of provenance.supplementalEntries) {
  const {sources, ...entry} = supplemental
  assert(sources.length > 0, 'expected provenance for `' + entry.code + '`')
  assert(
    !(entry.code in byCode),
    'expected supplemental code `' + entry.code + '`'
  )
  byCode[entry.code] = {...entry, stack: []}
}

/** @type {Record<string, string>} */
const toIso = {}

/** @type {Array<UNM49>} */
const codes = Object.keys(byCode)
  .sort()
  .map((code) => {
    const {stack, ...entry} = byCode[code]
    const clean = {...entry, parent: stack.pop()}

    if (clean.iso3166) {
      toIso[clean.code] = clean.iso3166
    }

    return clean
  })

await fs.writeFile(
  'index.js',
  [
    '/**',
    ' * @typedef {0|1|2|3|4} Type',
    ' *   *   `0` — Global (example: `001` `World`)',
    ' *   *   `1` — Region (example: `002` `Africa`)',
    ' *   *   `2` — Subregion (example: `202` `Sub-Saharan Africa`)',
    ' *   *   `3` — Intermediate region (example: `017` `Middle Africa`)',
    ' *   *   `4` — Country or area (example: `024` `Angola`)',
    ' *',
    ' * @typedef UNM49',
    ' *   Region.',
    ' * @property {Type} type',
    ' *   Type of region (example: `4`).',
    ' * @property {string} name',
    " *   Name of region (example: `'United Kingdom of Great Britain and Northern Ireland'`).",
    ' * @property {string} code',
    ' *   Three-character UN M49 code (example: `826`).',
    ' * @property {string|undefined} [iso3166]',
    " *   ISO 3166-1 alpha-3 code, if `type` represents a country or area (example: `'GBR'`).",
    ' * @property {string|undefined} [parent]',
    " *   Code of parent region, if `type` does not represent the planet (example: `'154'`).",
    ' * @property {true|undefined} [historical]',
    ' *   Whether this code is retired or no longer in current use.',
    ' */',
    '',
    '/**',
    ' * List of `Region`s.',
    ' *',
    ' * @type {Array<UNM49>}',
    ' */',
    'export const unM49 = ' + JSON.stringify(codes, null, 2),
    '',
    '/**',
    ' * Map of UN M49 codes to ISO 3166-1 alpha-3 codes.',
    ' *',
    ' * @type {Record<string, string>}',
    ' */',
    'export const toIso3166 = ' + JSON.stringify(toIso, null, 2),
    ''
  ].join('\n')
)
