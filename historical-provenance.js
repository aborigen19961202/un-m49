/**
 * @typedef SourceReference
 * @property {string} source
 * @property {number} page
 *
 * @typedef ProvenanceSource
 * @property {string} id
 * @property {string} edition
 * @property {number} year
 * @property {string} url
 * @property {string} sha256
 * @property {string} format
 * @property {string|undefined} [countryOrAreaPages]
 * @property {string|undefined} [abbreviationPages]
 * @property {string|undefined} [changePages]
 *
 * @typedef SupplementalEntry
 * @property {4} type
 * @property {string} name
 * @property {string} code
 * @property {string|undefined} [iso3166]
 * @property {true} historical
 * @property {Array<SourceReference>} sources
 *
 * @typedef ReusedCode
 * @property {string} code
 * @property {string} historicalName
 * @property {string} currentName
 * @property {Array<SourceReference>} sources
 *
 * @typedef HistoricalProvenance
 * @property {1} schemaVersion
 * @property {string} scope
 * @property {Array<ProvenanceSource>} sources
 * @property {Array<SupplementalEntry>} supplementalEntries
 * @property {Array<ReusedCode>} reusedCodes
 */

import fs from 'node:fs/promises'

/** @type {HistoricalProvenance} */
export const provenance = JSON.parse(
  await fs.readFile(
    new URL('data/historical-provenance.json', import.meta.url),
    'utf8'
  )
)
