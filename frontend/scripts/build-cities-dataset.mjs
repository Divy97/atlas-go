#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CITIES_API_URL = 'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/cities.json';
const COUNTRIES_API_URL = 'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json';

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

// Manual aliases for common alternative city names
const MANUAL_ALIAS_TO_ID = {
	nyc: null, // Will be set to New York City ID
	la: null, // Will be set to Los Angeles ID
	sf: null, // Will be set to San Francisco ID
	dc: null, // Will be set to Washington D.C. ID
	mumbai: null, // Will be set to Mumbai ID (was Bombay)
	chennai: null, // Will be set to Chennai ID (was Madras)
	kolkata: null, // Will be set to Kolkata ID (was Calcutta)
	beijing: null, // Will be set to Beijing ID (was Peking)
	stpetersburg: null, // Will be set to Saint Petersburg ID
	rio: null, // Will be set to Rio de Janeiro ID
	saigon: null, // Will be set to Ho Chi Minh City ID
	bombay: null, // Alternative name for Mumbai
	madras: null, // Alternative name for Chennai
	calcutta: null, // Alternative name for Kolkata
	peking: null, // Alternative name for Beijing
	leningrad: null, // Alternative name for Saint Petersburg
	constantinople: null, // Historical name for Istanbul
	stalingrad: null, // Historical name for Volgograd
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

async function buildCities() {
	console.log('Fetching cities data...');
	const rawCities = await fetchJson(CITIES_API_URL);
	console.log('Fetching countries data...');
	const rawCountries = await fetchJson(COUNTRIES_API_URL);

	// Create country lookup map
	const countryMap = new Map();
	for (const country of rawCountries) {
		countryMap.set(country.id, country);
	}

	const cities = [];
	const aliasToCanonical = {};
	const letterIndex = {};
	const ambiguousAliases = new Set();
	const cityIdMap = new Map(); // For manual alias resolution

	// Filter out cities without proper names or that are too small/obscure
	const filteredCities = rawCities.filter(city => {
		if (!city.name || city.name.length < 2) return false;
		// Keep cities that have coordinates or are in major countries
		return true;
	});

	console.log(`Processing ${filteredCities.length} cities...`);

	for (const rawCity of filteredCities) {
		const cityId = rawCity.id.toString();
		const cityName = rawCity.name;
		const country = countryMap.get(parseInt(rawCity.country_id));
		const countryName = country ? country.name : 'Unknown';
		const countryCode = country ? country.iso2 : 'XX';
		const displayName = cityName;
		const latitude = parseFloat(rawCity.latitude) || null;
		const longitude = parseFloat(rawCity.longitude) || null;
		const stateId = rawCity.state_id ? rawCity.state_id.toString() : null;

		const canonical = canonicalize(displayName);
		const first = firstLetter(canonical);
		const last = lastLetter(canonical);

		// Skip cities without valid canonical form
		if (!canonical || !first || !last) continue;

		const cityData = {
			id: cityId,
			name: cityName,
			displayName,
			country: countryName,
			countryCode,
			stateId,
			latitude,
			longitude,
			firstLetter: first,
			lastLetter: last
		};

		cities.push(cityData);
		cityIdMap.set(canonical, cityId);

		// Create aliases
		const aliases = new Set();
		aliases.add(cityName);
		
		// Add common abbreviations and variations
		if (cityName.includes(' ')) {
			// Add initials for multi-word cities
			const words = cityName.split(' ');
			if (words.length <= 3) {
				const initials = words.map(w => w.charAt(0)).join('').toLowerCase();
				if (initials.length >= 2) aliases.add(initials);
			}
		}

		// Process aliases
		for (const alias of aliases) {
			const c = canonicalize(alias);
			if (!c) continue;
			if (aliasToCanonical[c] && aliasToCanonical[c] !== cityId) {
				ambiguousAliases.add(c);
				continue;
			}
			aliasToCanonical[c] = cityId;
		}

		// Build letter index
		if (first) {
			if (!letterIndex[first]) letterIndex[first] = [];
			letterIndex[first].push(cityId);
		}
	}

	// Set up manual aliases based on actual city IDs found
	const manualAliasMapping = {
		'newyorkcity': 'nyc',
		'newyork': 'nyc',
		'losangeles': 'la',
		'sanfrancisco': 'sf',
		'washington': 'dc',
		'washingtondc': 'dc',
		'mumbai': 'mumbai',
		'chennai': 'chennai',
		'kolkata': 'kolkata',
		'beijing': 'beijing',
		'saintpetersburg': 'stpetersburg',
		'riodejaneiro': 'rio',
		'hochiminhcity': 'saigon',
	};

	// Add manual aliases where cities exist
	for (const [canonical, alias] of Object.entries(manualAliasMapping)) {
		const cityId = cityIdMap.get(canonical);
		if (cityId && !ambiguousAliases.has(alias) && !aliasToCanonical[alias]) {
			aliasToCanonical[alias] = cityId;
		}
	}

	// Remove ambiguous aliases
	for (const a of ambiguousAliases) {
		delete aliasToCanonical[a];
	}

	// Sort letter index
	for (const k of Object.keys(letterIndex)) {
		letterIndex[k].sort();
	}

	// Sort cities by display name
	cities.sort((a, b) => a.displayName.localeCompare(b.displayName, 'en'));

	console.log(`Processed ${cities.length} cities from ${new Set(cities.map(c => c.country)).size} countries`);

	return { cities, aliasToCanonical, letterIndex, ambiguousAliases: Array.from(ambiguousAliases).sort() };
}

async function main() {
	console.log('Building cities dataset from GitHub countries-states-cities-database...');
	const { cities, aliasToCanonical, letterIndex, ambiguousAliases } = await buildCities();
	const finishedAt = new Date().toISOString();

	const manifest = {
		version: 'v1',
		builtAt: finishedAt,
		sources: { 
			cities: CITIES_API_URL,
			countries: COUNTRIES_API_URL 
		},
		counts: {
			cities: cities.length,
			aliases: Object.keys(aliasToCanonical).length,
			letters: Object.keys(letterIndex).length,
			ambiguousAliases: ambiguousAliases.length
		},
		license: {
			cities: 'Countries States Cities Database - Open Source',
			note: 'Data compiled from various open sources including GeoNames and other geographical databases'
		},
		notes: 'Prebuilt offline dataset for atlas gameplay. v1 contains cities only.'
	};

	// Convert data to base64 for embedded version
	const citiesB64 = Buffer.from(JSON.stringify(cities)).toString('base64');
	const aliasesB64 = Buffer.from(JSON.stringify(aliasToCanonical)).toString('base64');
	const letterIndexB64 = Buffer.from(JSON.stringify(letterIndex)).toString('base64');
	const manifestB64 = Buffer.from(JSON.stringify(manifest)).toString('base64');

	// Create the embedded cities-atlas-data.ts content
	const atlasDataContent = `// 🔒 Base64 encoded cities game data for security
// Data is embedded directly in JavaScript bundle - no discoverable URLs!

// Encoded data strings (base64)
const CITIES_DATA = '${citiesB64}';
const ALIASES_DATA = '${aliasesB64}';  
const LETTER_INDEX_DATA = '${letterIndexB64}';
const MANIFEST_DATA = '${manifestB64}';

// Define City type based on the expected structure
export type City = {
	id: string;
	name: string;
	displayName: string;
	country: string;
	countryCode: string;
	stateId: string | null;
	latitude: number | null;
	longitude: number | null;
	firstLetter: string;
	lastLetter: string;
};

// Decode data at runtime
const cities = JSON.parse(atob(CITIES_DATA)) as City[];
const aliasToCanonical = JSON.parse(atob(ALIASES_DATA)) as Record<string, string>;
const letterIndex = JSON.parse(atob(LETTER_INDEX_DATA)) as Record<string, string[]>;
const manifest = JSON.parse(atob(MANIFEST_DATA)) as {
	version: string;
	builtAt: string;
	counts: { cities: number; aliases: number; letters: number; ambiguousAliases: number };
};

const citiesById = new Map<string, City>(cities.map((c) => [c.id, c]));

// --- Public API ---

export const datasetInfo = {
	version: manifest.version,
	builtAt: new Date(manifest.builtAt),
	counts: manifest.counts
};

/**
 * All available cities, sorted by display name.
 */
export const allCities = cities;

/**
 * Returns a city by its unique ID.
 */
export function getCityById(id: string): City | undefined {
	return citiesById.get(id);
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
 * Resolve an alias (alternative name) to a canonical city ID.
 */
export function resolveAlias(alias: string): string | null {
	const canonical = canonicalize(alias);
	return aliasToCanonical[canonical] || null;
}

/**
 * Get all cities that start with the given letter.
 */
export function getCitiesByFirstLetter(letter: string): City[] {
	const ids = letterIndex[letter.toLowerCase()] || [];
	return ids.map((id) => citiesById.get(id)).filter(Boolean) as City[];
}

/**
 * Get a random letter that has at least one city.
 */
export function getRandomAvailableLetter(): string {
	const letters = Object.keys(letterIndex);
	return letters[Math.floor(Math.random() * letters.length)];
}
`;

	// Write the embedded version to src/lib/cities-atlas-data.ts
	await writeFile(path.join(process.cwd(), 'src', 'lib', 'cities-atlas-data.ts'), atlasDataContent);

	console.log('✅ Base64 embedded cities-atlas-data.ts generated successfully!');
	console.log('📊 Embedded data sizes:');
	console.log('  - Cities: ' + (citiesB64.length / 1024).toFixed(1) + 'KB');
	console.log('  - Aliases: ' + (aliasesB64.length / 1024).toFixed(1) + 'KB'); 
	console.log('  - Letter Index: ' + (letterIndexB64.length / 1024).toFixed(1) + 'KB');
	console.log('  - Total embedded: ' + ((citiesB64.length + aliasesB64.length + letterIndexB64.length + manifestB64.length) / 1024).toFixed(1) + 'KB');
	console.log('🔒 No external data files - everything bundled in JavaScript!');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});