/** Extract stay dates and party size from A2A / agent natural language. */

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, enero: 1, ene: 1, января: 1, янв: 1,
  february: 2, feb: 2, febrero: 2, февраля: 2, фев: 2,
  march: 3, mar: 3, marzo: 3, марта: 3,
  april: 4, apr: 4, abril: 4, abr: 4, апреля: 4, апр: 4,
  may: 5, mayo: 5, мая: 5,
  june: 6, jun: 6, junio: 6, июня: 6, июн: 6,
  july: 7, jul: 7, julio: 7, июля: 7, июл: 7,
  august: 8, aug: 8, agosto: 8, ago: 8, августа: 8, авг: 8,
  september: 9, sep: 9, sept: 9, septiembre: 9, сентября: 9, сен: 9,
  october: 10, oct: 10, octubre: 10, октября: 10, окт: 10,
  november: 11, nov: 11, noviembre: 11, ноября: 11, ноя: 11,
  december: 12, dec: 12, diciembre: 12, dic: 12, декабря: 12, дек: 12,
};

const WORD_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  один: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function iso(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const stamp = Date.UTC(year, month - 1, day);
  const check = new Date(stamp);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function collectMatches(text: string, pattern: RegExp) {
  const matches: RegExpExecArray[] = [];
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    matches.push(match);
    if (match[0] === "") re.lastIndex += 1;
  }
  return matches;
}

export function flattenAgentInput(input: unknown): string {
  if (typeof input === "string") return input;
  if (!input) return "";
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

export function findIsoDates(input: unknown): string[] {
  return Array.from(new Set(flattenAgentInput(input).match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []));
}

function parseMonthToken(token: string): number | null {
  const key = token.toLowerCase().replace(/\./g, "");
  return MONTHS[key] ?? null;
}

function parseNaturalDates(text: string): string[] {
  const lower = text.toLowerCase().replace(/[–—]/g, "-");
  const found: string[] = [];

  const rangeNamed = lower.match(
    /\b(\d{1,2})\s*(?:al|to|and|-|\/)\s*(\d{1,2})\s+([a-zа-яё.]+)\s+(\d{4})\b/i
  );
  if (rangeNamed) {
    const month = parseMonthToken(rangeNamed[3]);
    const year = Number(rangeNamed[4]);
    if (month) {
      const a = iso(year, month, Number(rangeNamed[1]));
      const b = iso(year, month, Number(rangeNamed[2]));
      if (a) found.push(a);
      if (b) found.push(b);
    }
  }

  for (const match of collectMatches(lower, /\b(\d{1,2})\s+(?:de\s+)?([a-zа-яё.]+)\s+(\d{4})\b/gi)) {
    const month = parseMonthToken(match[2]);
    if (!month) continue;
    const date = iso(Number(match[3]), month, Number(match[1]));
    if (date) found.push(date);
  }

  for (const match of collectMatches(lower, /\b(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})\b/g)) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = month > 12 ? iso(year, day, month) : iso(year, month, day);
    if (date) found.push(date);
  }

  return Array.from(new Set(found));
}

export function extractStayDates(input: unknown): string[] {
  const isoDates = findIsoDates(input);
  if (isoDates.length >= 2) return isoDates.slice(0, 2);
  const natural = parseNaturalDates(flattenAgentInput(input));
  const merged = Array.from(new Set([...isoDates, ...natural]));
  if (merged.length >= 2) return merged.slice(0, 2);
  if (merged.length === 1) {
    const nights = extractNights(input) ?? 2;
    return [merged[0], addDays(merged[0], nights)];
  }
  return merged;
}

export function extractNights(input: unknown): number | undefined {
  const text = flattenAgentInput(input).toLowerCase();
  const numeric = text.match(/\b(\d{1,2})\s*(?:nights?|noches?|ноч)/i);
  if (numeric) return Number(numeric[1]);
  return undefined;
}

export function extractParty(input: unknown): { adults?: number; children?: number } {
  const value = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = value[key];
      if (Number.isInteger(candidate)) return candidate as number;
    }
    return undefined;
  };
  let adults = pick("adults", "numAdults", "guests");
  let children = pick("children", "numChildren");
  const text = flattenAgentInput(input).toLowerCase();
  const adultMatch = text.match(/\b(\d+|one|two|three|four|five|six|dos|tres|cuatro|два|две|три)\s*(?:adults?|adultos?|взрослы)/i);
  if (!adults && adultMatch) {
    adults = WORD_NUM[adultMatch[1]] ?? Number(adultMatch[1]);
  }
  const childMatch = text.match(/\b(\d+|one|two|three|four|dos|tres|два)\s*(?:children|child|kids?|niños?|дет)/i);
  if (!children && childMatch) {
    children = WORD_NUM[childMatch[1]] ?? Number(childMatch[1]);
  }
  return { adults, children };
}

export function wantsCompare(text: string) {
  const s = text.toLowerCase();
  return /\b(compare|value|longer|nightly|mejor valor|сравн)\b/.test(s);
}

export function wantsBooking(text: string) {
  const s = text.toLowerCase();
  return /\b(book|reserv|direct|checkout|бронир)\b/.test(s);
}

export function wantsAvailability(text: string) {
  const s = text.toLowerCase();
  return /\b(availab|price|precio|dates|noches|nights|units|disponible|доступн)\b/.test(s);
}
