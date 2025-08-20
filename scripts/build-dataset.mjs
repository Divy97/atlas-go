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
	const outDir = path.join(process.cwd(), 'public', 'data', 'atlas', 'v1');
	await ensureDir(outDir);

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

	await writeJson(path.join(outDir, 'countries.json'), countries);
	await writeJson(path.join(outDir, 'countries-alias.json'), aliasToCanonical);
	await writeJson(path.join(outDir, 'countries-letter-index.json'), letterIndex);
	await writeJson(path.join(outDir, 'dataset.json'), manifest);

	console.log('Done. Output written to:', outDir);
	console.log('Counts:', manifest.counts);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
}); 