const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="admin-skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="admin-skeleton-row"
          style={{ "--admin-skeleton-columns": columns }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <span
              key={`cell-${rowIndex}-${columnIndex}`}
              className="admin-skeleton-cell"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
