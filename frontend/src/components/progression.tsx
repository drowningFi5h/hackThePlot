import {
  LineChart,
  ResponsiveContainer,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";

const colors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F06292",
  "#AED581",
  "#7986CB",
  "#4DB6AC",
  "#FFD54F",
];

const progression = (props: { chartData: any[] }) => {
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active: boolean;
    payload: any[];
    label: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-2 rounded">
          <p className="text-green-400">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {props.chartData?.length > 0 ? <LineChart
        data={props.chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="time" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip
          content={<CustomTooltip active={false} payload={[]} label={""} />}
        />
        <Legend />
        {Object.keys(props.chartData[0])
          .filter((key) => key !== "time")
          .map((team, index) => (
            <Line
              key={team}
              type="monotone"
              dataKey={team}
              stroke={colors[index]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        {Object.keys(props.chartData[0])
          .filter((key) => key !== "time")
          .map((team, index) => (
            <Scatter
              key={`scatter-${team}`}
              //@ts-ignore
              data={props.chartData.filter((entry) => entry[team] % 20 === 0)}
              fill={colors[index]}
              name={`${team} Solved`}
            >
              {props.chartData.map((entry, i) => (
                <Scatter key={i} dataKey={team} fill={colors[index]} />
              ))}
            </Scatter>
          ))}
      </LineChart> : <div></div>}
    </ResponsiveContainer>
  );
};

export default progression;
