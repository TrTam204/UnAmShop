const Table = ({ columns, data, loading, emptyMessage = 'No data available' }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="py-12 text-center text-[var(--text-muted)]">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] ${
                  column.className || ''
                }`}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {data.map((row, index) => (
            <tr
              key={row._id || row.id || index}
              className="transition-colors hover:bg-[var(--surface-soft)]"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-4 text-sm text-[var(--text-primary)] ${column.className || ''}`}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
