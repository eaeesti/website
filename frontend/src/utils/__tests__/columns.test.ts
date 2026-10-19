import { describe, it, expect } from "vitest";
import { blocksTextLength } from "../blocks";
import { balanceColumns } from "../columns";

describe("balanceColumns", () => {
  it("alternates items of equal height", () => {
    expect(balanceColumns([1, 2, 3, 4], () => 1)).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });

  it("puts each item in the shorter column", () => {
    expect(balanceColumns([10, 2, 3, 4], (n) => n)).toEqual([[10], [2, 3, 4]]);
  });
});

describe("blocksTextLength", () => {
  it("counts text in paragraphs, links and lists", () => {
    expect(
      blocksTextLength([
        {
          type: "paragraph",
          children: [
            { type: "text", text: "abc" },
            {
              type: "link",
              url: "x",
              children: [{ type: "text", text: "de" }],
            },
          ],
        },
        {
          type: "list",
          format: "unordered",
          children: [
            { type: "list-item", children: [{ type: "text", text: "f" }] },
          ],
        },
      ]),
    ).toBe(6);
    expect(blocksTextLength(null)).toBe(0);
  });
});
