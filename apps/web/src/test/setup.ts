import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { ResizeObserverMock } from "./ResizeObserverMock";

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

beforeEach(() => {
  ResizeObserverMock.reset();
});

afterEach(() => {
  cleanup();
});
