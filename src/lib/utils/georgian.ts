// Georgian ↔ Latin transliteration (national system)
// Sorted longest-first so multi-char sequences match before single chars

const LATIN_TO_GEORGIAN: [string, string][] = [
  // 3-char
  ["ts'", "წ"],
  ["ch'", "ჭ"],
  // 2-char
  ["sh", "შ"],
  ["ch", "ჩ"],
  ["ts", "ც"],
  ["dz", "ძ"],
  ["zh", "ჟ"],
  ["gh", "ღ"],
  ["kh", "ხ"],
  ["t'", "ტ"],
  ["p'", "პ"],
  ["k'", "კ"],
  // 1-char
  ["a", "ა"],
  ["b", "ბ"],
  ["g", "გ"],
  ["d", "დ"],
  ["e", "ე"],
  ["v", "ვ"],
  ["z", "ზ"],
  ["t", "თ"],
  ["i", "ი"],
  ["k", "კ"],
  ["l", "ლ"],
  ["m", "მ"],
  ["n", "ნ"],
  ["o", "ო"],
  ["p", "პ"],
  ["r", "რ"],
  ["s", "ს"],
  ["u", "უ"],
  ["f", "ფ"],
  ["q", "ქ"],
  ["j", "ჯ"],
  ["h", "ჰ"],
  ["w", "ვ"],
  ["y", "ი"],
];

const GEORGIAN_TO_LATIN: [string, string][] = [
  ["წ", "ts'"],
  ["ჭ", "ch'"],
  ["შ", "sh"],
  ["ჩ", "ch"],
  ["ც", "ts"],
  ["ძ", "dz"],
  ["ჟ", "zh"],
  ["ღ", "gh"],
  ["ხ", "kh"],
  ["ტ", "t'"],
  ["პ", "p'"],
  ["ა", "a"],
  ["ბ", "b"],
  ["გ", "g"],
  ["დ", "d"],
  ["ე", "e"],
  ["ვ", "v"],
  ["ზ", "z"],
  ["თ", "t"],
  ["ი", "i"],
  ["კ", "k'"],
  ["ლ", "l"],
  ["მ", "m"],
  ["ნ", "n"],
  ["ო", "o"],
  ["რ", "r"],
  ["ს", "s"],
  ["უ", "u"],
  ["ფ", "f"],
  ["ქ", "q"],
  ["ჯ", "j"],
  ["ჰ", "h"],
];

export function latinToGeorgian(text: string): string {
  let result = text.toLowerCase();
  for (const [latin, geo] of LATIN_TO_GEORGIAN) {
    result = result.split(latin).join(geo);
  }
  return result;
}

export function georgianToLatin(text: string): string {
  let result = text;
  for (const [geo, latin] of GEORGIAN_TO_LATIN) {
    result = result.split(geo).join(latin);
  }
  return result;
}

export function isGeorgianScript(text: string): boolean {
  return /[\u10A0-\u10FF]/.test(text);
}
