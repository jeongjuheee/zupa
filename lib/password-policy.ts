const ALLOWED_SPECIAL_CHARACTERS = "!@#$%^&*()-_=+[]{};:,.?/";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  noWhitespace: boolean;
  allowedCharacters: boolean;
  doesNotContainEmail: boolean;
  valid: boolean;
};

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function getPasswordChecks(email: string, value: string): PasswordChecks {
  const password = value.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const escapedSpecials = ALLOWED_SPECIAL_CHARACTERS.replace(/[\[\]\\^-]/g, "\\$&");
  const checks = {
    minLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: new RegExp(`[${escapedSpecials}]`).test(password),
    noWhitespace: !/\s/.test(value),
    allowedCharacters: new RegExp(`^[A-Za-z0-9${escapedSpecials}]+$`).test(password),
    doesNotContainEmail: !normalizedEmail || !password.toLowerCase().includes(normalizedEmail),
  };
  return { ...checks, valid: Object.values(checks).every(Boolean) };
}

export const PASSWORD_POLICY_MESSAGE = "비밀번호는 12자 이상이며, 영문 대문자, 영문 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.";
