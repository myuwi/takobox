import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { File } from "@takobox/sdk";
import { client } from "@/api/client";
import { collectionsOptions } from "@/queries/collections";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { ResizeObserverMock } from "@/test/ResizeObserverMock";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { FileGrid } from "./FileGrid";
import { RenameDialog } from "./RenameDialog";

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
      <ConfirmationDialog />
      <RenameDialog />
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

const expectSelectedFiles = (...selectedIndexes: number[]) => {
  const selectedNames = selectedIndexes.map((index) => `file-${index}.txt`);
  const { cells, checkboxes } = getGridElements();

  const selectedGridCells = cells
    .filter((cell) => cell.getAttribute("aria-selected") === "true")
    .map((cell) => cell.getAttribute("aria-label"));
  const selectedCheckboxes = checkboxes
    .filter((checkbox) => checkbox.getAttribute("aria-checked") === "true")
    .map((checkbox) => checkbox.getAttribute("aria-label")?.replace("Select ", ""));

  expect(selectedGridCells).toEqual(selectedNames);
  expect(selectedCheckboxes).toEqual(selectedNames);
};

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

describe("focus and tab order", () => {
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
});

describe("keyboard navigation", () => {
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
          cells
            .filter((cell) => cell.tabIndex === 0)
            .map((cell) => cell.getAttribute("aria-label")),
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
    expect(actionButtons.filter((button) => button.tabIndex === 0)).toEqual([
      screen.getByRole("button", { name: "Actions for file-3.txt" }),
    ]);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("responsive behavior", () => {
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

  test.each([
    { role: "checkbox" as const, name: "Select file-1.txt" },
    { role: "button" as const, name: "Actions for file-1.txt" },
  ])("resizing keeps focus on the file $role", ({ role, name }) => {
    renderGrid(navigationFiles);
    setColumnCount(3);

    const control = screen.getByRole(role, { name });
    control.focus();

    setColumnCount(2);

    expect(control).toHaveFocus();
  });
});

describe("selection", () => {
  test("Space selects the focused file and clears the previous selection", async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(screen.getByRole("gridcell", { name: "file-0.txt" }));
    screen.getByRole("gridcell", { name: "file-1.txt" }).focus();
    await user.keyboard(" ");

    expectSelectedFiles(1);
  });

  test("Ctrl+Space toggles the focused file without clearing another selection", async () => {
    const user = userEvent.setup();
    renderGrid();

    screen.getByRole("gridcell", { name: "file-0.txt" }).focus();
    await user.keyboard(" ");
    screen.getByRole("gridcell", { name: "file-1.txt" }).focus();
    await user.keyboard("{Control>} {/Control}");
    expectSelectedFiles(0, 1);

    await user.keyboard("{Control>} {/Control}");
    expectSelectedFiles(0);
  });

  test("Space on a checkbox toggles its file without invoking gridcell selection", async () => {
    const user = userEvent.setup();
    renderGrid();

    const checkbox = screen.getByRole("checkbox", { name: "Select file-1.txt" });
    checkbox.focus();
    await user.keyboard(" ");
    expectSelectedFiles(1);

    await user.keyboard(" ");
    expectSelectedFiles();
  });

  test("Shift+ArrowDown selects the range through the destination file", async () => {
    const user = userEvent.setup();
    renderGrid(navigationFiles);
    setColumnCount(3);

    screen.getByRole("gridcell", { name: "file-1.txt" }).focus();
    await user.keyboard(" ");
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

    expect(screen.getByRole("gridcell", { name: "file-4.txt" })).toHaveFocus();
    expectSelectedFiles(1, 2, 3, 4);
  });

  test("Shift+ArrowRight establishes an anchor at the origin and selects the destination", async () => {
    const user = userEvent.setup();
    renderGrid();

    screen.getByRole("gridcell", { name: "file-1.txt" }).focus();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");

    expect(screen.getByRole("gridcell", { name: "file-2.txt" })).toHaveFocus();
    expectSelectedFiles(1, 2);
  });

  test("Shift+ArrowLeft extends selection backward from the anchor", async () => {
    const user = userEvent.setup();
    renderGrid(navigationFiles);

    screen.getByRole("gridcell", { name: "file-4.txt" }).focus();
    await user.keyboard(" ");
    await user.keyboard("{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}");

    expect(screen.getByRole("gridcell", { name: "file-2.txt" })).toHaveFocus();
    expectSelectedFiles(2, 3, 4);
  });

  test("Shift+ArrowLeft shrinks and reverses a forward selection around its original anchor", async () => {
    const user = userEvent.setup();
    renderGrid(navigationFiles);

    screen.getByRole("gridcell", { name: "file-1.txt" }).focus();
    await user.keyboard(" ");
    await user.keyboard("{Shift>}{ArrowRight}{ArrowRight}{/Shift}");
    expectSelectedFiles(1, 2, 3);

    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expectSelectedFiles(1, 2);

    await user.keyboard("{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}");
    expect(screen.getByRole("gridcell", { name: "file-0.txt" })).toHaveFocus();
    expectSelectedFiles(0, 1);
  });

  test("Ctrl+A selects every file and Escape clears the selection", async () => {
    const user = userEvent.setup();
    renderGrid();

    screen.getByRole("gridcell", { name: "file-0.txt" }).focus();
    await user.keyboard("{Control>}a{/Control}");
    expectSelectedFiles(0, 1, 2);

    await user.keyboard("{Escape}");
    expectSelectedFiles();
  });
});

describe("menu access and focus return", () => {
  test("Space on an actions button opens its file menu", async () => {
    const user = userEvent.setup();
    renderGrid();

    screen.getByRole("button", { name: "Actions for file-1.txt" }).focus();
    await user.keyboard(" ");

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expectSelectedFiles(1);
  });

  test("Escape closes a menu opened with Enter and restores focus to the actions button", async () => {
    const user = userEvent.setup();
    renderGrid();

    const actionsButton = screen.getByRole("button", { name: "Actions for file-0.txt" });
    actionsButton.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(actionsButton).toHaveFocus());
  });

  test("closing a context menu opened from a gridcell restores focus to the cell", async () => {
    const user = userEvent.setup();
    renderGrid();

    const cell = screen.getByRole("gridcell", { name: "file-0.txt" });
    cell.focus();
    fireEvent.contextMenu(cell);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(cell).toHaveFocus());
  });

  test("closing a context menu opened from a checkbox restores focus to the checkbox", async () => {
    const user = userEvent.setup();
    renderGrid();

    const checkbox = screen.getByRole("checkbox", { name: "Select file-0.txt" });
    checkbox.focus();
    fireEvent.contextMenu(checkbox);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(checkbox).toHaveFocus());
  });

  test("closing a rename dialog restores focus to the element that opened the menu", async () => {
    const user = userEvent.setup();
    renderGrid();

    const checkbox = screen.getByRole("checkbox", { name: "Select file-0.txt" });
    checkbox.focus();
    fireEvent.contextMenu(checkbox);
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(checkbox).toHaveFocus());
  });

  test("closing a delete dialog restores focus to the element that opened the menu", async () => {
    const user = userEvent.setup();
    renderGrid();

    const checkbox = screen.getByRole("checkbox", { name: "Select file-0.txt" });
    checkbox.focus();
    fireEvent.contextMenu(checkbox);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(checkbox).toHaveFocus());
  });

  test("deleting a file restores focus to the next file", async () => {
    vi.spyOn(client.files, "delete").mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    renderGrid();

    const cell = screen.getByRole("gridcell", { name: "file-1.txt" });
    cell.focus();
    fireEvent.contextMenu(cell);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    await user.click(screen.getByRole("button", { name: "Delete File" }));

    await waitFor(() => expect(screen.getByRole("gridcell", { name: "file-2.txt" })).toHaveFocus());
  });

  test("deleting the final file restores focus to the previous file", async () => {
    vi.spyOn(client.files, "delete").mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    renderGrid();

    const cell = screen.getByRole("gridcell", { name: "file-2.txt" });
    cell.focus();
    fireEvent.contextMenu(cell);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    await user.click(screen.getByRole("button", { name: "Delete File" }));

    await waitFor(() => expect(screen.getByRole("gridcell", { name: "file-1.txt" })).toHaveFocus());
  });
});
