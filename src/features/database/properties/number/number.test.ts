import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { setPropertyConfig } from "../../database.commands.ts";
import { formatNumber, numberShare } from "./number-format.ts";

const PLAIN = { format: "number", display: "number" } as const;

describe("formatNumber", () => {
  it("writes a plain number without grouping", () => {
    expect(formatNumber(1234.5, PLAIN)).toBe("1234.5");
  });

  it("writes a number with commas", () => {
    expect(formatNumber(1234.5, { ...PLAIN, format: "comma" })).toBe("1,234.5");
  });

  it("writes a fraction as a percent", () => {
    expect(formatNumber(0.256, { ...PLAIN, format: "percent" })).toBe("25.6%");
  });

  it("writes the decimal places the property sets", () => {
    expect(formatNumber(2, { ...PLAIN, decimals: 2 })).toBe("2.00");
    expect(formatNumber(1.236, { ...PLAIN, decimals: 1 })).toBe("1.2");
  });

  it("writes a currency the way the locale does", () => {
    const config = { ...PLAIN, format: "currency", currency: "BRL" } as const;

    expect(formatNumber(1234.5, config, "pt-BR")).toBe("R$ 1.234,50");
  });

  it("writes US dollars when a currency has no code yet", () => {
    expect(formatNumber(2, { ...PLAIN, format: "currency" })).toBe("$2.00");
  });
});

describe("numberShare", () => {
  it("is the value's share of the divisor, between 0 and 1", () => {
    const bar = { ...PLAIN, display: "bar", divideBy: 200 } as const;

    expect(numberShare(50, bar)).toBe(0.25);
    expect(numberShare(500, bar)).toBe(1);
    expect(numberShare(-5, bar)).toBe(0);
  });

  it("divides by 100 when no divisor is set", () => {
    expect(numberShare(30, { ...PLAIN, display: "ring" })).toBe(0.3);
  });
});

describe("property.setConfig", () => {
  it("stores a property's config", () => {
    const app = createDatabaseApp([{ name: "Price", type: "number" }], []);
    const [propertyId] = app.propertyIds;
    if (propertyId === undefined) throw new Error("setup");
    const config = { format: "percent", display: "bar", divideBy: 1 };

    app.dispatch(
      setPropertyConfig.create({
        databaseId: app.databaseId,
        propertyId,
        config,
      }),
    );

    expect(app.database().props.properties[0]?.config).toEqual(config);
  });
});
