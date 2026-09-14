import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444"];

export default function ProcedureSuccessChart({ data }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>

          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            outerRadius={110}
            label
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i]}
              />
            ))}
          </Pie>

          <Tooltip />

        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}