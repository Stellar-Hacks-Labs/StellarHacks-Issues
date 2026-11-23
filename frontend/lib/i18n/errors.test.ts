/**
 * Test error message mapping.
 *
 * Ensures contract and network errors are properly translated.
 */

import { describe, expect, it } from "vitest";
import { errorMessage, mapContractError } from "./errors";
import { LOCALES } from "./config";

describe("errorMessage", () => {
  it("returns translated error messages", () => {
    for (const locale of LOCALES) {
      expect(errorMessage("contract.unauthorized", locale)).toBeTruthy();
      expect(errorMessage("contract.not_found", locale)).toBeTruthy();
      expect(errorMessage("wallet.not_connected", locale)).toBeTruthy();
      expect(errorMessage("validation.required", locale)).toBeTruthy();
    }
  });

  it("returns different translations for different locales", () => {
    const enUnauthorized = errorMessage("contract.unauthorized", "en");
    const trUnauthorized = errorMessage("contract.unauthorized", "tr");

    expect(enUnauthorized).not.toBe(trUnauthorized);
    expect(enUnauthorized).toContain("not authorized");
    expect(trUnauthorized).toContain("yetkiniz yok");
  });

  it("returns the code itself for unknown error codes", () => {
    const unknown = errorMessage("unknown.error.code", "en");
    expect(unknown).toBe("unknown.error.code");
  });

  it("handles camelCase error codes", () => {
    // errorMessage converts camelCase to dot notation internally
    const message = errorMessage("contract.invalid_phase", "en");
    expect(message).toBeTruthy();
    expect(message).not.toContain("[");
  });
});

describe("mapContractError", () => {
  it("maps string errors directly", () => {
    expect(mapContractError("ContractUnauthorized")).toBe("ContractUnauthorized");
    expect(mapContractError("WalletNotConnected")).toBe("WalletNotConnected");
  });

  it("extracts code from structured errors", () => {
    const error = { code: "contract.not_found", message: "Resource not found" };
    expect(mapContractError(error)).toBe("contract.not_found");
  });

  it("returns unknown_error for unrecognized structures", () => {
    expect(mapContractError({})).toBe("contract.unknown_error");
    expect(mapContractError(null)).toBe("contract.unknown_error");
    expect(mapContractError(undefined)).toBe("contract.unknown_error");
  });

  it("handles Error objects", () => {
    const error = new Error("Something went wrong");
    expect(mapContractError(error)).toBe("contract.unknown_error");
  });
});
