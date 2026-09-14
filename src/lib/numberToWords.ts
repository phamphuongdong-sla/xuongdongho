// Helper function: Convert number to Vietnamese words for accounting vouchers
// SOWASUCO WM Standard

const UNITS_WORDS = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const TIENS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readGroup3Digits(group: string): string {
  const num = parseInt(group, 10);
  if (num === 0) return '';

  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;
  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;

  let result = '';

  if (hundreds > 0 || group.length === 3) {
    result += UNITS_WORDS[hundreds] + ' trăm ';
  }

  if (tens === 0 && units !== 0) {
    result += 'lẻ ';
  } else if (tens === 1) {
    result += 'mười ';
  } else if (tens > 1) {
    result += UNITS_WORDS[tens] + ' mươi ';
  }

  if (tens > 0 && units === 1) {
    result += 'mốt ';
  } else if (tens > 0 && units === 5) {
    result += 'lăm ';
  } else if (units > 0) {
    result += UNITS_WORDS[units] + ' ';
  }

  return result.trim();
}

export function numberToVietnameseWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) {
    return 'Không đồng';
  }

  const rounded = Math.round(Math.abs(amount));
  let str = rounded.toString();

  while (str.length % 3 !== 0) {
    str = '0' + str;
  }

  const groups: string[] = [];
  for (let i = 0; i < str.length; i += 3) {
    groups.push(str.substring(i, i + 3));
  }

  let words = '';
  const totalGroups = groups.length;

  for (let i = 0; i < totalGroups; i++) {
    const groupNum = parseInt(groups[i], 10);
    if (groupNum > 0) {
      const groupText = readGroup3Digits(groups[i]);
      const scaleIndex = totalGroups - 1 - i;
      const scaleText = scaleIndex < TIENS.length ? TIENS[scaleIndex] : '';
      words += (words ? ' ' : '') + groupText + (scaleText ? ' ' + scaleText : '');
    }
  }

  words = words.trim();
  if (!words) return 'Không đồng';

  words = words.charAt(0).toUpperCase() + words.slice(1);
  return words + ' đồng chẵn./.';
}
