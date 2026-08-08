import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with scrypt.
 *
 * scrypt is memory-hard, which is what makes a stolen hash expensive to attack
 * with GPUs. It ships with Node, so there is no native dependency to build.
 * Parameters follow the Node defaults with an explicitly raised cost.
 */
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384, // CPU/memory cost — roughly 16 MB per hash.
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

export interface PasswordHash {
  hash: string;
  salt: string;
}

/**
 * Wraps the callback form of scrypt. `promisify` cannot pick the right overload
 * once an options object is passed, and the resulting cast hides the return type.
 */
function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEY_LENGTH,
      SCRYPT_OPTIONS,
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      }
    );
  });
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(16).toString("hex");
  const derived = await deriveKey(password, salt);
  return { hash: derived.toString("hex"), salt };
}

/**
 * Verifies a password against a stored hash.
 *
 * The comparison is constant-time: a plain `===` on hex strings leaks how many
 * leading characters matched through its timing, which is enough to reconstruct
 * a hash byte by byte.
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  try {
    const derived = await deriveKey(password, salt);
    const expected = Buffer.from(hash, "hex");
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export interface PasswordStrength {
  acceptable: boolean;
  issues: string[];
}

/**
 * Checks a password against a deliberately modest policy.
 *
 * Length carries most of the strength, so the rules ask for a reasonable
 * minimum and block the handful of passwords that appear in every breach list,
 * rather than demanding symbol soup that pushes people towards writing it on a
 * note by the till.
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];

  if (password.length < 10) {
    issues.push("Use at least 10 characters.");
  }
  if (password.length > 200) {
    issues.push("Keep it under 200 characters.");
  }
  if (!/[a-zA-Z]/.test(password)) {
    issues.push("Include at least one letter.");
  }
  if (!/[0-9]/.test(password)) {
    issues.push("Include at least one number.");
  }

  const common = [
    "password", "12345678", "123456789", "1234567890", "qwerty123",
    "password1", "password123", "admin123", "welcome123", "abc123456",
    "iloveyou", "letmein123",
  ];
  if (common.includes(password.toLowerCase())) {
    issues.push("This password is too common to be safe.");
  }

  return { acceptable: issues.length === 0, issues };
}
