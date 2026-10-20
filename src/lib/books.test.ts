import { describe, expect, it } from "vitest";
import { packRows, savedToShelf, spineHeight, spineWidth, yearText, isLightColor } from "./books";

describe("book rules", () => {
  it("maps saved book _id/coverColor to shelf id/color", () => {
    const s = savedToShelf({ _id: "abc", title: "T", coverColor: "#123456" });
    expect(s.id).toBe("abc");
    expect(s.color).toBe("#123456");
  });
  it("uses n.d. for missing year", () => expect(yearText(null)).toBe("n.d."));
  it("height is stable per id", () => expect(spineHeight("x1")).toBe(spineHeight("x1")));
  it("width stays in range", () => {
    expect(spineWidth(5)).toBe(26);
    expect(spineWidth(5000)).toBe(56);
  });
  it("packs rows within width", () => {
    expect(packRows([10, 10, 10], (n) => n, 25, 0)).toEqual([[10, 10], [10]]);
  });
  it("picks dark text on light backgrounds", () => {
    expect(isLightColor("#f5f0e0")).toBe(true);
    expect(isLightColor("#1a1a1a")).toBe(false);
  });
});
