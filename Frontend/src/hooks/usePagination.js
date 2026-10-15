import { useEffect, useState } from "react";

/* Slices a list into pages.
   resetKey: when this value changes (e.g. the search text), go back to page 1. */
export function usePagination(items, initialSize = 10, resetKey = "") {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount); // stays valid if rows get deleted/filtered
  const start = (current - 1) * pageSize;

  return {
    page: current,
    pageSize,
    pageCount,
    total: items.length,
    pageItems: items.slice(start, start + pageSize),
    setPage,
    setPageSize: (n) => {
      setPageSize(n);
      setPage(1);
    },
  };
}