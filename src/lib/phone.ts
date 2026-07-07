const MOBILE_MIN_DIGITS = 7;
const MOBILE_MAX_DIGITS = 15;

export function normalizeMobileNumber(input: string): string {
  return input.replace(/\D/g, '');
}

export function isValidMobileNumber(input: string): boolean {
  const digits = normalizeMobileNumber(input);
  return digits.length >= MOBILE_MIN_DIGITS && digits.length <= MOBILE_MAX_DIGITS;
}
