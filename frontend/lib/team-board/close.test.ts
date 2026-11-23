import { describe, expect, it } from "vitest";
import { FULL_TEAM, OPEN_LISTING, OPEN_TEAM } from "./fixtures";
import { closeFilled } from "./close";

describe("a full team closes its listing", () => {
  it("closes team 1 at a maximum of three and leaves team 2 open", () => {
    const second = { ...OPEN_LISTING, id: "list-2", teamId: 2 };
    const closed = closeFilled([OPEN_LISTING, second], [FULL_TEAM, OPEN_TEAM], 3);
    expect(closed.find((listing) => listing.teamId === 1)?.status).toBe("closed");
    expect(closed.find((listing) => listing.teamId === 2)?.status).toBe("open");
  });
});
