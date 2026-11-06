import { describe, expect, it } from "vitest";
import {
  buildCatalogueHref,
  hasActiveFilters,
  parseCatalogueParams,
} from "@/lib/validations/catalogue-params";

describe("parseCatalogueParams", () => {
  it("applies defaults for an empty query", () => {
    expect(parseCatalogueParams({})).toEqual({ sort: "newest", page: 1 });
  });

  it("parses valid filters", () => {
    expect(
      parseCatalogueParams({
        q: "  creta ",
        category: "suvs",
        fuel: "DIESEL",
        ownership: "1",
        yearMin: "2018",
        priceMax: "1000000",
        sort: "price_asc",
        page: "2",
      }),
    ).toMatchObject({
      q: "creta",
      category: "suvs",
      fuel: "DIESEL",
      ownership: "1",
      yearMin: 2018,
      priceMax: 1_000_000,
      sort: "price_asc",
      page: 2,
    });
  });

  it("ignores malformed values instead of failing", () => {
    const params = parseCatalogueParams({
      category: "SUVs'; DROP TABLE",
      fuel: "STEAM",
      yearMin: "1890",
      priceMin: "-5",
      sort: "random",
      page: "0",
      q: "x".repeat(200),
    });
    expect(params).toEqual({ sort: "newest", page: 1 });
  });

  it("takes the first value of repeated parameters", () => {
    expect(parseCatalogueParams({ brand: ["honda", "hyundai"] }).brand).toBe("honda");
  });

  it("treats empty strings as unset", () => {
    expect(parseCatalogueParams({ q: "", brand: "" })).toEqual({ sort: "newest", page: 1 });
  });
});

describe("buildCatalogueHref", () => {
  it("drops defaults and empty values", () => {
    expect(buildCatalogueHref({ sort: "newest", page: 1 })).toBe("/vehicles");
    expect(buildCatalogueHref({ category: "suvs", brand: undefined, page: 3 })).toBe(
      "/vehicles?category=suvs&page=3",
    );
  });

  it("round-trips through the parser", () => {
    const href = buildCatalogueHref({ fuel: "PETROL", priceMin: 300_000, sort: "price_desc" });
    const query = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(parseCatalogueParams(query)).toMatchObject({
      fuel: "PETROL",
      priceMin: 300_000,
      sort: "price_desc",
    });
  });
});

describe("hasActiveFilters", () => {
  it("ignores sort and page", () => {
    expect(hasActiveFilters({ q: undefined, sort: "oldest", page: 4 })).toBe(false);
    expect(hasActiveFilters({ q: undefined, sort: "newest", page: 1, brand: "honda" })).toBe(true);
  });
});
