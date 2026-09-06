import { createContext, useContext } from "react";

export const BlogInteractionsContext = createContext(null);

export function useBlogInteractions() {
  const ctx = useContext(BlogInteractionsContext);
  if (!ctx) throw new Error("useBlogInteractions must be used inside BlogInteractionsProvider");
  return ctx;
}
