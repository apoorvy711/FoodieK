const DataCard = ({ title, value, note }) => {
  return (
    <article className="admin-data-card">
      <p className="admin-data-card-title">{title}</p>
      <p className="admin-data-card-value">{value}</p>
      {note && <p className="admin-data-card-note">{note}</p>}
    </article>
  );
};

export default DataCard;
