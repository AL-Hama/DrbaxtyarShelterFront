export default function Table({
  columns,
  data,
}) {
  return (
    <div className="overflow-hidden rounded-3xl shadow-soft bg-white">
      <table className="w-full">
        <thead>
          <tr className="bg-orange-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="p-4 text-left"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-t hover:bg-orange-50"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="p-4"
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}