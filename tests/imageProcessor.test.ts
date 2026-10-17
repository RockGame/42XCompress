import { describe, expect, it } from "vitest";
import { formatBytes, savingsLabel } from "../src/imageProcessor";

describe("formatBytes", () => {
  it("formats bytes and kilobytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
  });
  it("handles invalid input", () => {
    expect(formatBytes(-1)).toBe("—");
  });
});
describe("savingsLabel", () => {
  it("labels savings and larger output", () => {
    expect(savingsLabel(25)).toBe("25.0% saved");
    expect(savingsLabel(-10)).toBe("10.0% larger");
    expect(savingsLabel(0)).toBe("0%");
  });
});
