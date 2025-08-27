type City = {
  id: string;
  displayName: string;
  country: string;
};

type CitiesDataModule = {
  canonicalize: (name: string) => string;
  getCitiesByFirstLetter: (letter: string) => Promise<City[]>;
  getCityById: (id: string) => Promise<City | undefined>;
  getRandomAvailableLetter: () => Promise<string>;
  resolveAlias: (name: string) => Promise<string | null>;
};

// Cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
  // Check cache first
  const cached = getCachedData<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Canonicalize function - normalize city names for comparison
function canonicalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
    .trim();
}

// Get cities by first letter
async function getCitiesByFirstLetter(letter: string): Promise<City[]> {
  const cacheKey = `cities-by-letter-${letter.toLowerCase()}`;
  return await fetchWithCache<City[]>(`/api/cities/by-letter/${letter.toLowerCase()}`, cacheKey);
}

// Get city by ID
async function getCityById(id: string): Promise<City | undefined> {
  try {
    const cacheKey = `city-by-id-${id}`;
    const city = await fetchWithCache<City>(`/api/cities/by-id/${id}`, cacheKey);
    return city;
  } catch (error) {
    // City not found
    return undefined;
  }
}

// Get random available letter
async function getRandomAvailableLetter(): Promise<string> {
  const response = await fetch('/api/cities/random-letter');
  if (!response.ok) {
    throw new Error('Failed to get random letter');
  }
  const data = await response.json();
  return data.letter;
}

// Resolve alias - search for city by name
async function resolveAlias(name: string): Promise<string | null> {
  try {
    const cacheKey = `search-${canonicalize(name)}`;
    const cities = await fetchWithCache<City[]>(`/api/cities/search?q=${encodeURIComponent(name)}&limit=5`, cacheKey);
    
    // Look for exact match first
    const canonical = canonicalize(name);
    for (const city of cities) {
      if (canonicalize(city.displayName) === canonical || canonicalize(city.displayName).includes(canonical)) {
        return city.id;
      }
    }
    
    // If no exact match, return the first result if it's close enough
    if (cities.length > 0) {
      const firstCity = cities[0];
      const firstCanonical = canonicalize(firstCity.displayName);
      
      // Check if the search term is a substring of the city name or vice versa
      if (firstCanonical.includes(canonical) || canonical.includes(firstCanonical)) {
        return firstCity.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error resolving alias:', error);
    return null;
  }
}

export const citiesService: CitiesDataModule = {
  canonicalize,
  getCitiesByFirstLetter,
  getCityById,
  getRandomAvailableLetter,
  resolveAlias,
}; 