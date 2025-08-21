#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const REST_COUNTRIES_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,altSpellings,independent,unMember,region,subregion,flags';

function canonicalize(raw) {
	if (!raw || typeof raw !== 'string') return '';
	const lower = raw.toLowerCase().trim();
	const withoutLeadingArticle = lower.startsWith('the ') ? lower.slice(4) : lower;
	const nfd = withoutLeadingArticle.normalize('NFD');
	const withoutDiacritics = nfd.replace(/[\u0300-\u036f]/g, '');
	const onlyLetters = withoutDiacritics.replace(/[^a-z]/g, '');
	return onlyLetters;
}

function firstLetter(canonical) {
	const m = canonical.match(/[a-z]/);
	return m ? m[0] : null;
}

function lastLetter(canonical) {
	const m = canonical.match(/[a-z](?=[^a-z]*$)/);
	return m ? m[0] : null;
}

const MANUAL_ALIAS_TO_CCA3 = {
	ivorycoast: 'CIV',
	czechrepublic: 'CZE',
	burma: 'MMR',
	netherlands: 'NLD',
	capeverde: 'CPV',
	russia: 'RUS',
	vaticancity: 'VAT',
	northkorea: 'PRK',
	southkorea: 'KOR',
	moldova: 'MDA',
	macedonia: 'MKD',
	bolivia: 'BOL',
	laos: 'LAO',
	iran: 'IRN',
	syria: 'SYR',
	taiwan: 'TWN'
};

async function ensureDir(dir) {
	await mkdir(dir, { recursive: true });
}

async function writeJson(filePath, data) {
	const json = JSON.stringify(data, null, 2);
	await writeFile(filePath, json, 'utf8');
}

async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

async function buildCountries() {
	const raw = await fetchJson(REST_COUNTRIES_URL);

	const countries = [];
	const aliasToCanonical = {};
	const letterIndex = {};
	const ambiguousAliases = new Set();

	for (const r of raw) {
		const cca3 = r.cca3;
		const cca2 = r.cca2;
		const nameCommon = r?.name?.common || cca3;
		const nameOfficial = r?.name?.official || nameCommon;
		const displayName = nameCommon;
		const region = r?.region || null;
		const subregion = r?.subregion || null;
		const independent = r?.independent ?? null;
		const unMember = r?.unMember ?? null;

		const canonical = canonicalize(displayName);
		const first = firstLetter(canonical);
		const last = lastLetter(canonical);

		countries.push({
			id: cca3,
			cca2,
			nameCommon,
			nameOfficial,
			displayName,
			region,
			subregion,
			independent,
			unMember,
			firstLetter: first,
			lastLetter: last
		});

		const aliases = new Set();
		aliases.add(nameCommon);
		aliases.add(nameOfficial);
		if (Array.isArray(r.altSpellings)) {
			for (const a of r.altSpellings) {
				if (a && typeof a === 'string') aliases.add(a);
			}
		}

		for (const alias of aliases) {
			const c = canonicalize(alias);
			if (!c) continue;
			if (aliasToCanonical[c] && aliasToCanonical[c] !== cca3) {
				ambiguousAliases.add(c);
				continue;
			}
			aliasToCanonical[c] = cca3;
		}

		if (first) {
			if (!letterIndex[first]) letterIndex[first] = [];
			letterIndex[first].push(cca3);
		}
	}

	for (const [alias, id] of Object.entries(MANUAL_ALIAS_TO_CCA3)) {
		if (ambiguousAliases.has(alias)) continue;
		if (!aliasToCanonical[alias]) aliasToCanonical[alias] = id;
	}

	for (const a of ambiguousAliases) {
		delete aliasToCanonical[a];
	}

	for (const k of Object.keys(letterIndex)) {
		letterIndex[k].sort();
	}

	countries.sort((a, b) => a.displayName.localeCompare(b.displayName, 'en'));

	return { countries, aliasToCanonical, letterIndex, ambiguousAliases: Array.from(ambiguousAliases).sort() };
}

async function main() {

	console.log('Building countries dataset from REST Countries...');
	const { countries, aliasToCanonical, letterIndex, ambiguousAliases } = await buildCountries();
	const finishedAt = new Date().toISOString();

	const manifest = {
		version: 'v1',
		builtAt: finishedAt,
		sources: { countries: REST_COUNTRIES_URL },
		counts: {
			countries: countries.length,
			aliases: Object.keys(aliasToCanonical).length,
			letters: Object.keys(letterIndex).length,
			ambiguousAliases: ambiguousAliases.length
		},
		license: {
			countries: 'REST Countries (public API)',
			cities: 'GeoNames (not included in v1) — CC BY 4.0'
		},
		notes: 'Prebuilt offline dataset for atlas gameplay. v1 contains countries only.'
	};

	// Convert data to base64 for embedded version
	const countriesB64 = Buffer.from(JSON.stringify(countries)).toString('base64');
	const aliasesB64 = Buffer.from(JSON.stringify(aliasToCanonical)).toString('base64');
	const letterIndexB64 = Buffer.from(JSON.stringify(letterIndex)).toString('base64');
	const manifestB64 = Buffer.from(JSON.stringify(manifest)).toString('base64');

	// Create the embedded atlas-data.ts content
	const atlasDataContent = `// 🔒 Base64 encoded game data for security
// Data is embedded directly in JavaScript bundle - no discoverable URLs!

// Encoded data strings (base64)
const COUNTRIES_DATA = '${countriesB64}';
const ALIASES_DATA = '${aliasesB64}';  
const LETTER_INDEX_DATA = '${letterIndexB64}';
const MANIFEST_DATA = '${manifestB64}';

// Define Country type based on the expected structure
export type Country = {
	id: string;
	cca2: string;
	nameCommon: string;
	nameOfficial: string;
	displayName: string;
	region: string;
	subregion: string;
	independent: boolean;
	unMember: boolean;
	firstLetter: string;
	lastLetter: string;
};

// Decode data at runtime
const countries = JSON.parse(atob(COUNTRIES_DATA)) as Country[];
const aliasToCanonical = JSON.parse(atob(ALIASES_DATA)) as Record<string, string>;
const letterIndex = JSON.parse(atob(LETTER_INDEX_DATA)) as Record<string, string[]>;
const manifest = JSON.parse(atob(MANIFEST_DATA)) as {
	version: string;
	builtAt: string;
	counts: { countries: number; aliases: number; letters: number; ambiguousAliases: number };
};

const countriesById = new Map<string, Country>(countries.map((c) => [c.id, c]));

// --- Public API ---

export const datasetInfo = {
	version: manifest.version,
	builtAt: new Date(manifest.builtAt),
	counts: manifest.counts
};

/**
 * All available countries, sorted by display name.
 */
export const allCountries = countries;

/**
 * Returns a country by its unique cca3 ID.
 */
export function getCountryById(id: string): Country | undefined {
	return countriesById.get(id);
}

/**
 * Canonicalizes an input string for matching.
 * This should match the logic used in the build script.
 */
export function canonicalize(raw: string): string {
	return raw
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\\u0300-\\u036f]/g, '')
		.replace(/[^a-z0-9]/g, '');
}

/**
 * Resolve an alias (alternative name) to a canonical country ID.
 */
export function resolveAlias(alias: string): string | null {
	const canonical = canonicalize(alias);
	return aliasToCanonical[canonical] || null;
}

/**
 * Get all countries that start with the given letter.
 */
export function getCountriesByFirstLetter(letter: string): Country[] {
	const ids = letterIndex[letter.toLowerCase()] || [];
	return ids.map((id) => countriesById.get(id)).filter(Boolean) as Country[];
}

/**
 * Get a random letter that has at least one country.
 */
export function getRandomAvailableLetter(): string {
	const letters = Object.keys(letterIndex);
	return letters[Math.floor(Math.random() * letters.length)];
}
`;

	// Write the embedded version to src/lib/atlas-data.ts
	await writeFile(path.join(process.cwd(), 'src', 'lib', 'atlas-data.ts'), atlasDataContent);

	console.log('✅ Base64 embedded atlas-data.ts generated successfully!');
	console.log('📊 Embedded data sizes:');
	console.log('  - Countries: ' + (countriesB64.length / 1024).toFixed(1) + 'KB');
	console.log('  - Aliases: ' + (aliasesB64.length / 1024).toFixed(1) + 'KB'); 
	console.log('  - Letter Index: ' + (letterIndexB64.length / 1024).toFixed(1) + 'KB');
	console.log('  - Total embedded: ' + ((countriesB64.length + aliasesB64.length + letterIndexB64.length + manifestB64.length) / 1024).toFixed(1) + 'KB');
	console.log('🔒 No external data files - everything bundled in JavaScript!');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
}); 