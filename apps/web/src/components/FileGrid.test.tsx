import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import type { File } from "@takobox/sdk";
import { collectionsOptions } from "@/queries/collections";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { ResizeObserverMock } from "@/test/ResizeObserverMock";
import { FileGrid } from "./FileGrid";

const createFile = (index: number): File => ({
  id: `file-${index}`,
  name: `file-${index}.txt`,
  filename: `file-${index}.txt`,
  size: (index + 1) * 100,
  createdAt: "2026-01-01T00:00:00Z",
});

const files = Array.from({ length: 3 }, (_, index) => createFile(index));
const navigationFiles = Array.from({ length: 8 }, (_, index) => createFile(index));

const renderGrid = (gridFiles = files) => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(collectionsOptions.queryKey, []);

  return renderWithProviders(
    <>
      <FileGrid files={gridFiles} />
      <button>Outside the grid</button>
    </>,
    { queryClient },
  );
};

const getGridElements = () => {
  const grid = within(screen.getByRole("grid"));

  return {
    cells: grid.getAllByRole("gridcell"),
    checkboxes: grid.getAllByRole("checkbox"),
    actionButtons: grid.getAllByRole("button", { name: /^Actions for / }),
  };
};

const setColumnCount = (columns: number) => {
  const grid = screen.getByRole("grid");
  grid.style.gridTemplateColumns = Array.from({ length: columns }, () => "1fr").join(" ");

  act(() => {
    ResizeObserverMock.notify(grid);
  });
};

test("only makes the active file and its controls tabbable", () => {
  renderGrid();

  const { cells, checkboxes, actionButtons } = getGridElements();

  expect(cells.map((cell) => cell.tabIndex)).toEqual([0, -1, -1]);
  expect(checkboxes.map((checkbox) => checkbox.tabIndex)).toEqual([0, -1, -1]);
  expect(actionButtons.map((button) => button.tabIndex)).toEqual([0, -1, -1]);
});

test("tabs through the active cell controls before leaving the grid", async () => {
  const user = userEvent.setup();
  renderGrid();

  await user.tab();
  expect(screen.getByRole("gridcell", { name: "file-0.txt" })).toHaveFocus();

  await user.tab();
  expect(screen.getByRole("checkbox", { name: "Select file-0.txt" })).toHaveFocus();

  await user.tab();
  expect(screen.getByRole("button", { name: "Actions for file-0.txt" })).toHaveFocus();

  await user.tab();
  expect(screen.getByRole("button", { name: "Outside the grid" })).toHaveFocus();
});

// prettier-ignore
const arrowNavigationCases = [
  { key: "ArrowRight", scenario: "moves focus to the next file in the same row", from: 0, to: 1 },
  { key: "ArrowLeft", scenario: "moves focus to the previous file in the same row", from: 1, to: 0 },
  { key: "ArrowRight", scenario: "moves focus from the row end to the first file in the next row", from: 2, to: 3 },
  { key: "ArrowLeft", scenario: "moves focus from the row start to the last file in the previous row", from: 3, to: 2 },
  { key: "ArrowDown", scenario: "moves focus directly below in the middle column", from: 1, to: 4 },
  { key: "ArrowUp", scenario: "moves focus directly above in the middle column", from: 4, to: 1 },
  { key: "ArrowUp", scenario: "moves focus directly above from the incomplete final row", from: 6, to: 3 },
  { key: "ArrowDown", scenario: "moves focus directly below into the incomplete final row", from: 4, to: 7 },
  { key: "ArrowDown", scenario: "moves focus to the final file when the next row lacks the last column", from: 5, to: 7 },
  { key: "ArrowDown", scenario: "moves focus to the final file when already on the final row", from: 6, to: 7 },
  { key: "ArrowUp", scenario: "moves focus to the first file when already on the first row", from: 2, to: 0 },
  { key: "ArrowRight", scenario: "keeps focus on the final file at the grid boundary", from: 7, to: 7 },
  { key: "ArrowLeft", scenario: "keeps focus on the first file at the grid boundary", from: 0, to: 0 },
  { key: "ArrowDown", scenario: "keeps focus on the final file at the grid boundary", from: 7, to: 7 },
  { key: "ArrowUp", scenario: "keeps focus on the first file at the grid boundary", from: 0, to: 0 },
] as const;

describe("arrow-key navigation in a three-column grid", () => {
  for (const { key, scenario, from, to } of arrowNavigationCases) {
    test(`${key} ${scenario} (${from} → ${to})`, async () => {
      const user = userEvent.setup();
      renderGrid(navigationFiles);
      setColumnCount(3);

      const { cells } = getGridElements();
      screen.getByRole("gridcell", { name: `file-${from}.txt` }).focus();

      await user.keyboard(`{${key}}`);

      expect(screen.getByRole("gridcell", { name: `file-${to}.txt` })).toHaveFocus();
      expect(
        cells.filter((cell) => cell.tabIndex === 0).map((cell) => cell.getAttribute("aria-label")),
      ).toEqual([`file-${to}.txt`]);
    });
  }
});

test("Home moves focus from a gridcell to the first file", async () => {
  const user = userEvent.setup();
  renderGrid(navigationFiles);

  screen.getByRole("gridcell", { name: "file-4.txt" }).focus();

  await user.keyboard("{Home}");

  expect(screen.getByRole("gridcell", { name: "file-0.txt" })).toHaveFocus();
});

test("End moves focus from a gridcell to the final file", async () => {
  const user = userEvent.setup();
  renderGrid(navigationFiles);

  screen.getByRole("gridcell", { name: "file-4.txt" }).focus();

  await user.keyboard("{End}");

  expect(screen.getByRole("gridcell", { name: "file-7.txt" })).toHaveFocus();
});

test("Home moves to the first file when focus starts on a checkbox", async () => {
  const user = userEvent.setup();
  renderGrid(navigationFiles);

  screen.getByRole("checkbox", { name: "Select file-4.txt" }).focus();

  await user.keyboard("{Home}");

  expect(screen.getByRole("gridcell", { name: "file-0.txt" })).toHaveFocus();
});

test("End moves to the final file when focus starts on an actions button", async () => {
  const user = userEvent.setup();
  renderGrid(navigationFiles);

  screen.getByRole("button", { name: "Actions for file-4.txt" }).focus();

  await user.keyboard("{End}");

  expect(screen.getByRole("gridcell", { name: "file-7.txt" })).toHaveFocus();
});

test("ArrowDown uses the new column count after the grid resizes", async () => {
  const user = userEvent.setup();
  renderGrid(navigationFiles);
  setColumnCount(3);

  const startCell = screen.getByRole("gridcell", { name: "file-0.txt" });
  startCell.focus();

  setColumnCount(2);

  expect(startCell).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("gridcell", { name: "file-2.txt" })).toHaveFocus();
});

test("ArrowRight moves to another cell when focus starts on a checkbox", async () => {
  const user = userEvent.setup();
  renderGrid();

  const { checkboxes } = getGridElements();
  screen.getByRole("checkbox", { name: "Select file-0.txt" }).focus();

  await user.keyboard("{ArrowRight}");

  expect(screen.getByRole("gridcell", { name: "file-1.txt" })).toHaveFocus();
  expect(checkboxes.map((checkbox) => checkbox.tabIndex)).toEqual([-1, 0, -1]);
});

test("ArrowDown moves from an actions button without opening its menu", async () => {
  const user = userEvent.setup();
  renderGrid(navigationFiles);
  setColumnCount(3);

  const { actionButtons } = getGridElements();
  screen.getByRole("button", { name: "Actions for file-0.txt" }).focus();

  await user.keyboard("{ArrowDown}");

  expect(screen.getByRole("gridcell", { name: "file-3.txt" })).toHaveFocus();
  expect(
    actionButtons
      .filter((button) => button.tabIndex === 0)
      .map((button) => button.getAttribute("aria-label")),
  ).toEqual(["Actions for file-3.txt"]);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});
