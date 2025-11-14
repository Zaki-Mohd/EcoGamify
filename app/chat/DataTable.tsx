"use client";

type DataRow = Record<string, any>;

interface DataTableProps {
  data: DataRow[];
}

export default function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) {
    return <p className="text-gray-400">No data found for this query.</p>;
  }

  // Get headers from the first row
  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto relative rounded-lg border border-gray-700">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-green-400 uppercase bg-gray-700">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="py-3 px-6">
                {header.replace(/_/g, " ")} {/* Make headers readable */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/80">
              {headers.map((header) => (
                <td key={`${rowIndex}-${header}`} className="py-4 px-6">
                  {/* Handle null/undefined values gracefully */}
                  {String(row[header] ?? 'N/A')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}