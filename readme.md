# un-m49 with historical codes

[![Build][build-badge]][build]

Machine-friendly current and official historical [UN M49][m49] codes.

This is a community fork of [`wooorm/un-m49`][upstream].  It preserves the
original API while adding retired country and area codes from official United
Nations publications.  The npm package named `un-m49` still refers to the
upstream project and does not contain these additions.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unM49`](#unm49)
    *   [`toIso3166`](#toiso3166)
*   [Sources and historical coverage](#sources-and-historical-coverage)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package contains current and historical UN M49 (Standard Country or Area
Codes for Statistical Use).  Historical examples include `200`
(Czechoslovakia), `278` (German Democratic Republic), `810` (USSR), and `890`
(Socialist Federal Republic of Yugoslavia).
UN M49 is similar to ISO 3166 (the `GB` in `en-GB`).
The difference is that ISO 3166 uses alphabetical codes based on how a region is
called by a group of people, whereas UN M49 uses numerical codes.
Numerical codes are useful because they are resistant to changes and
geopolitical conflicts.
UN M49 also contains regions bigger than countries, such as (sub)continents.
That’s useful for example for `es-419` to describe Spanish as used in Latin
America and the Caribbean.

## When should I use this?

You can use this package any time you have to deal with regions or UN M49 in
particular.

## Install

This package is [ESM only][esm].  Until this fork is published under a distinct
npm name, install it directly from GitHub:

```sh
npm install github:aborigen19961202/un-m49
```

## Use

```js
import {unM49} from 'un-m49'

console.log(unM49.slice(0, 20))
```

Yields:

```js
[
  {type: 0, name: 'World', code: '001'},
  {type: 1, name: 'Africa', code: '002', parent: '001'},
  {type: 4, name: 'Afghanistan', code: '004', iso3166: 'AFG', parent: '034'},
  {type: 3, name: 'South America', code: '005', parent: '419'},
  {type: 4, name: 'Albania', code: '008', iso3166: 'ALB', parent: '039'},
  {type: 1, name: 'Oceania', code: '009', parent: '001'},
  {type: 4, name: 'Antarctica', code: '010', iso3166: 'ATA', parent: '001'},
  {type: 3, name: 'Western Africa', code: '011', parent: '202'},
  {type: 4, name: 'Algeria', code: '012', iso3166: 'DZA', parent: '015'},
  {type: 3, name: 'Central America', code: '013', parent: '419'},
  {type: 3, name: 'Eastern Africa', code: '014', parent: '202'},
  {type: 2, name: 'Northern Africa', code: '015', parent: '002'},
  {type: 4, name: 'American Samoa', code: '016', iso3166: 'ASM', parent: '061'},
  {type: 3, name: 'Middle Africa', code: '017', parent: '202'},
  {type: 3, name: 'Southern Africa', code: '018', parent: '202'},
  {type: 1, name: 'Americas', code: '019', parent: '001'},
  {type: 4, name: 'Andorra', code: '020', iso3166: 'AND', parent: '039'},
  {type: 2, name: 'Northern America', code: '021', parent: '019'},
  {type: 4, name: 'Angola', code: '024', iso3166: 'AGO', parent: '017'},
  {type: 4, name: 'Antigua and Barbuda', code: '028', iso3166: 'ATG', parent: '029'}
]
```

## API

This package exports the identifiers `unM49` and `toIso3166`.
There is no default export.

### `unM49`

List of [`Region`][region]s (`Array<Region>`).

#### `Region`

Object with the following properties:

*   `type` (`Type`)
    — [`Type`][type]
    (example: `4`)
*   `name` (`string`)
    — name
    (example: `'United Kingdom of Great Britain and Northern Ireland'`)
*   `code` (`string`)
    — three-character UN M49 code
    (example: `826`)
*   `iso3166` (`string?`)
    — ISO 3166-1 alpha-3 code, if `type` represents a country or area
    (example: `'GBR'`)
*   `parent` (`string?`)
    — code of parent region, if `type` does not represent the planet
    (example: `'154'`)
*   `historical` (`true?`)
    — present and set to `true` when the code is retired or no longer in current
    use; current entries do not have this property for backwards compatibility

Historical entries have no `parent` when the current UN source does not define
a current hierarchy for them.  Their `iso3166` value, when present, is the
official alpha-3 code published for that entity in the relevant UN M49 revision.

#### `Type`

`number`, one of the following:

*   `0` — global (example: `001` `World`)
*   `1` — region (example: `002` `Africa`)
*   `2` — subregion (example: `202` `Sub-Saharan Africa`)
*   `3` — intermediate region (example: `017` `Middle Africa`)
*   `4` — country or area (example: `024` `Angola`)

> 👉 **Note**: Regions can be “missing” between a region and its parent.
> For example, the parent of the “country or area” (`4`) `010` `Antarctica` is
> `001` `World` (`4`).
> Intermediate regions (`3`) aren’t used a lot.

### `toIso3166`

Map of current and historical UN M49 codes to ISO 3166-1 alpha-3 codes
(`Record<string, string>`), where the United Nations publishes an unambiguous
mapping.

## Sources and historical coverage

The build combines the current [UN M49 overview][m49-overview], the retired
tables on the [UN M49 methodology page][m49], and all five official editions
published in 1970, 1975, 1982, 1996, and 1999.  Early retired codes missing from
the current web tables are stored with page-level references in the
machine-readable [`data/historical-provenance.json`][provenance] file and are
merged by `build.js`.

Run `npm run audit` to validate the provenance against the generated dataset.
Run `npm run audit-sources` to additionally download the five official UN PDFs
and verify their recorded SHA-256 checksums.  The first three editions are image
scans, so their small page-referenced transcription is checked in instead of
making the build depend on nondeterministic OCR.

Some numerical codes were later reassigned to a different entity.  For example,
`728` meant Spanish North Africa in the 1970 edition and means South Sudan in
the current dataset.  Such collisions are listed as `reusedCodes` in the
provenance file but are not emitted as duplicate `unM49` entries, because
`toIso3166` can contain only one value per numerical code.  This preserves the
current API and makes the limitation explicit.

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `Type` and `UNM49`.

## Compatibility

Use a maintained Node.js release.  The generated module has no runtime
dependencies and also works in modern ESM-compatible runtimes and browsers.

## Security

This package is safe.

## Related

*   [`country-normalizer`](https://github.com/aborigen19961202/agent-skills/tree/main/skills/country-normalizer)
    — portable Agent Skill for normalizing country and geographic references
    with a compact local index generated from this dataset
*   [`wooorm/bcp-47`](https://github.com/wooorm/bcp-47)
    — parse and stringify BCP 47 language tags
*   [`wooorm/bcp-47-match`](https://github.com/wooorm/bcp-47-match)
    — match BCP 47 language tags with language ranges per RFC 4647
*   [`wooorm/bcp-47-normalize`](https://github.com/wooorm/bcp-47-normalize)
    — normalize, canonicalize, and format BCP 47 tags
*   [`wooorm/iso-3166`](https://github.com/wooorm/iso-3166)
    — ISO 3166 codes
*   [`wooorm/iso-639-2`](https://github.com/wooorm/iso-639-2)
    — ISO 639-2 codes
*   [`wooorm/iso-639-3`](https://github.com/wooorm/iso-639-3)
    — ISO 639-3 codes
*   [`wooorm/iso-15924`](https://github.com/wooorm/iso-15924)
    — ISO 15924 codes

## Contribute

Yes please!
See [How to Contribute to Open Source][contribute].

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definition -->

[build-badge]: https://github.com/aborigen19961202/un-m49/actions/workflows/main.yml/badge.svg

[build]: https://github.com/aborigen19961202/un-m49/actions

[upstream]: https://github.com/wooorm/un-m49

[license]: license

[author]: https://wooorm.com

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[typescript]: https://www.typescriptlang.org

[contribute]: https://opensource.guide/how-to-contribute/

[m49]: https://unstats.un.org/unsd/methodology/m49/

[m49-overview]: https://unstats.un.org/unsd/methodology/m49/overview/

[provenance]: data/historical-provenance.json

[region]: #region

[type]: #type
