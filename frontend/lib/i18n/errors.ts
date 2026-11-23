/**
 * Error message mapping for contract and network errors.
 *
 * Maps error codes to localized messages without changing the codes themselves.
 */

import { createTranslator } from "./translate";
import type { Locale } from "./config";

/**
 * Get a localized error message for a code.
 *
 * Returns the translated message if the code exists, or the code itself wrapped
 * in brackets if not found (same pattern as missing translation keys).
 */
export function errorMessage(code: string, locale: Locale): string {
  const t = createTranslator(locale, "errors");

  // Convert error codes to dot notation keys
  // e.g., "ContractUnauthorized" -> "contract.unauthorized"
  const key = code
    .replace(/([A-Z])/g, (match, letter, offset) => (offset > 0 ? "_" + letter.toLowerCase() : letter.toLowerCase()))
    .replace(/_/g, ".");

  const message = t(key);

  // If the message is wrapped in brackets (missing key), return the original code
  return message.startsWith("[") ? code : message;
}

/**
 * Map common contract error patterns to error codes.
 *
 * This helper identifies known error patterns and returns the appropriate code.
 * Use when the contract returns structured errors that need translation.
 */
export function mapContractError(error: unknown): string {
  if (typeof error === "string") {
    // Simple string errors map directly
    return error;
  }

  if (error && typeof error === "object" && "code" in error) {
    // Structured errors with a code field
    return String((error as { code: string }).code);
  }

  // Unknown error structure
  return "contract.unknown_error";
}
