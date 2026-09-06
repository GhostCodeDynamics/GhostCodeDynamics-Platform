import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => "blob:mock-preview");
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

// dnd-kit measures sortable containers via ResizeObserver, which jsdom does
// not implement.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverMock;
}