import { describe, it, expect } from "vitest";
import { parseServiceNotation, formatServiceNotation } from "./parser";

describe("parseServiceNotation", () => {
  // 1. Standard format
  it("should parse standard format", () => {
    const result = parseServiceNotation(
      "80 + 油5 + 淋20 + 拔20 + 美35 + 刮10 + T15"
    );
    expect(result.massageBase).toBe(80);
    expect(result.items).toHaveLength(6);
    expect(result.cardTip).toBe(15);
    expect(result.cashTip).toBe(0);
    expect(result.massageTotal).toBe(80 + 5 + 20 + 20 + 10);
    expect(result.facialTotal).toBe(35);
    expect(result.serviceTotal).toBe(80 + 5 + 20 + 20 + 35 + 10);
    expect(result.totalWithTips).toBe(80 + 5 + 20 + 20 + 35 + 10 + 15);
    expect(result.unknownTokens).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  // 2. No spaces
  it("should parse no-space format", () => {
    const result = parseServiceNotation("80+油5+淋20+拔20");
    expect(result.massageBase).toBe(80);
    expect(result.items).toHaveLength(3);
    expect(result.serviceTotal).toBe(80 + 5 + 20 + 20);
  });

  // 3. Chinese comma
  it("should parse Chinese comma format", () => {
    const result = parseServiceNotation("80，油5，淋20，拔20");
    expect(result.massageBase).toBe(80);
    expect(result.items).toHaveLength(3);
  });

  // 4. English comma
  it("should parse English comma format", () => {
    const result = parseServiceNotation("80,油5,淋20,拔20");
    expect(result.massageBase).toBe(80);
    expect(result.items).toHaveLength(3);
  });

  // 5. Slash
  it("should parse slash format", () => {
    const result = parseServiceNotation("80 / 油5 / 淋20 / 拔20");
    expect(result.massageBase).toBe(80);
    expect(result.items).toHaveLength(3);
  });

  // 6. Multiple spaces
  it("should parse multiple spaces format", () => {
    const result = parseServiceNotation("80    油5    淋20");
    expect(result.massageBase).toBe(80);
    expect(result.items).toHaveLength(2);
  });

  // 7. Decimal amounts
  it("should parse decimal amounts", () => {
    const result = parseServiceNotation("82.75 + 刮10");
    expect(result.massageBase).toBe(82.75);
    expect(result.items).toHaveLength(1);
    expect(result.massageTotal).toBe(92.75);
  });

  // 8. Unknown tokens
  it("should detect unknown tokens", () => {
    const result = parseServiceNotation("80 + 油5 + 未知项目20 + T15");
    expect(result.unknownTokens.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("未知项目"))).toBe(true);
  });

  // 9. No massage base amount
  it("should warn when no massage base amount", () => {
    const result = parseServiceNotation("油5 + 淋20");
    expect(result.massageBase).toBe(0);
    expect(result.warnings.some((w) => w.includes("按摩基础金额"))).toBe(true);
  });

  // 10. Duplicate items
  it("should warn about duplicate items", () => {
    const result = parseServiceNotation("80 + 油5 + 油10");
    expect(result.warnings.some((w) => w.includes("重复"))).toBe(true);
  });

  // 11. Amount anomaly
  it("should warn about anomalous amounts", () => {
    const result = parseServiceNotation("80 + 油50");
    expect(result.warnings.some((w) => w.includes("异常"))).toBe(true);
  });

  // 12. Cash tip
  it("should parse cash tip", () => {
    const result = parseServiceNotation("100 + 拔20 + CT15");
    expect(result.cashTip).toBe(15);
    expect(result.cardTip).toBe(0);
    expect(result.items).toHaveLength(2);
  });

  // 13. Card tip
  it("should parse card tip", () => {
    const result = parseServiceNotation("80 + 油5 + T15");
    expect(result.cardTip).toBe(15);
    expect(result.cashTip).toBe(0);
  });

  // 14. Only massage amount
  it("should parse only massage amount", () => {
    const result = parseServiceNotation("80");
    expect(result.massageBase).toBe(80);
    expect(result.items).toHaveLength(0);
    expect(result.massageTotal).toBe(80);
    expect(result.facialTotal).toBe(0);
  });

  // 15. Massage + facial
  it("should parse massage and facial", () => {
    const result = parseServiceNotation("115 + 油10 + 美35 + T30");
    expect(result.massageBase).toBe(115);
    expect(result.massageTotal).toBe(115 + 10);
    expect(result.facialTotal).toBe(35);
    expect(result.cardTip).toBe(30);
  });

  // 16. Mixed Chinese and English abbreviations
  it("should parse mixed Chinese and English abbreviations", () => {
    const result = parseServiceNotation("80 + O5 + 淋20 + C20 + F35 + G10 + T15");
    expect(result.massageBase).toBe(80);
    expect(result.items).toHaveLength(6);
    expect(result.massageTotal).toBe(80 + 5 + 20 + 20 + 10);
    expect(result.facialTotal).toBe(35);
  });

  // 17. Empty string
  it("should handle empty string", () => {
    const result = parseServiceNotation("");
    expect(result.warnings).toHaveLength(1);
  });

  // 18. Tip higher than service
  it("should warn when tip is higher than service", () => {
    const result = parseServiceNotation("80 + T200");
    expect(result.warnings.some((w) => w.includes("小费高于"))).toBe(true);
  });

  // 19. CBD oil
  it("should parse CBD oil", () => {
    const result = parseServiceNotation("75 + CBD20 + T20");
    // Filter out tips from items
    const serviceItems = result.items.filter(i => i.category !== "card_tip" && i.category !== "cash_tip");
    expect(serviceItems).toHaveLength(1);
    const cbd = serviceItems[0];
    expect(cbd.name).toBe("CBD Oil");
    expect(cbd.amount).toBe(20);
  });

  // 20. Muscle Gun and Thai Stretch
  it("should parse Muscle Gun and Thai Stretch", () => {
    const result = parseServiceNotation("100 + 枪15 + 拉15");
    expect(result.items).toHaveLength(2);
    expect(result.massageTotal).toBe(100 + 15 + 15);
  });
});

describe("formatServiceNotation", () => {
  it("should format standard data", () => {
    const result = formatServiceNotation({
      massageBase: 80,
      items: [
        { code: "Oil Upgrade", amount: 5, category: "massage" },
        { code: "Lymphatic", amount: 20, category: "massage" },
        { code: "Facial", amount: 35, category: "facial" },
      ],
      cardTip: 15,
      cashTip: 0,
    });
    expect(result).toBe("80 + 油5 + 淋20 + 美35 + T15");
  });

  it("should format without massage base", () => {
    const result = formatServiceNotation({
      massageBase: 0,
      items: [{ code: "Facial", amount: 35, category: "facial" }],
      cardTip: 0,
      cashTip: 0,
    });
    expect(result).toBe("美35");
  });

  it("should format with cash tip", () => {
    const result = formatServiceNotation({
      massageBase: 100,
      items: [],
      cardTip: 0,
      cashTip: 20,
    });
    expect(result).toBe("100 + CT20");
  });
});