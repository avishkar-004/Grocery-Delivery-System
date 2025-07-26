import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const SimpleBarChart = ({ data, dataKey, nameKey, color }) => {

  // Custom Tooltip component to display both label (date/period) and value
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      // Safely format the value for the tooltip
      const formattedValue = typeof value === 'number' && !isNaN(value) ? `₹${value.toFixed(2)}` : 'N/A';

      // Determine how to format the label based on nameKey or typical period formats
      let formattedLabel = label;
      if (nameKey === "date" && typeof label === 'string' && label.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedLabel = format(new Date(label), 'MMM dd, yyyy');
      } else if (nameKey === "period" && typeof label === 'number') {
        // Assuming 'period' could be month number or yearweek
        if (label >= 1 && label <= 12) { // Month number
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          formattedLabel = monthNames[label - 1];
        } else if (label.toString().length === 6) { // YearWeek
          formattedLabel = `Week ${label.toString().slice(4)}`;
        }
      }


      return (
        <div className="custom-tooltip p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
          <p className="label text-sm font-semibold text-gray-900 dark:text-gray-100">{`${formattedLabel}`}</p>
          <p className="intro text-sm text-seller-accent">{`${payload[0].name}: ${formattedValue}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5, right: 30, left: 20, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey={nameKey || "period"} tickFormatter={(value) => {
          if (nameKey === "name") return value; // For product names
          // For periods (monthly, daily, weekly)
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          if (typeof value === 'number' && value >= 1 && value <= 12) return monthNames[value - 1]; // Month number
          // Check if value is a date string (YYYY-MM-DD) for daily
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return format(new Date(value), 'MMM dd');
          }
          // For weekly (YYYYWW format, e.g., 202401)
          if (typeof value === 'number' && value.toString().length === 6) {
            return `Week ${value.toString().slice(4)}`;
          }
          return value; // Fallback
        }} />
        <YAxis />
        {/* Use the CustomTooltip component */}
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SimpleBarChart;
