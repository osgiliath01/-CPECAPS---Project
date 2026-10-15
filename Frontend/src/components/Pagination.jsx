export default function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPage,
  onPageSize,
  sizes = [5, 10, 20, 50],
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <label className="pagesize">
        Rows per page
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
          {sizes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <span className="pageinfo">
        {from}–{to} of {total}
      </span>

      <div className="pagebtns">
        <button className="pill sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Previous
        </button>
        <span>
          Page {page} of {pageCount}
        </span>
        <button className="pill sm" onClick={() => onPage(page + 1)} disabled={page >= pageCount}>
          Next
        </button>
      </div>
    </nav>
  );
}