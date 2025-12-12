import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface PriceChartProps {
  data: [number, number][] | null;
  height?: number;
  isLoading?: boolean;
}

export default function PriceChart({ data, height = 200, isLoading = false }: PriceChartProps) {
  if (isLoading) {
    return (
      <View style={[styles.container, { height }]}>
        <ActivityIndicator size="large" color="#4E44CE" />
      </View>
    );
  }

  if (!data || data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No chart data available</Text>
      </View>
    );
  }

  // Extract prices from the data
  const prices = data.map(([_, price]) => price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Determine if price went up or down
  const isPositive = prices[prices.length - 1] >= prices[0];
  const lineColor = isPositive ? '#30D158' : '#FF453A';
  const gradientColor = isPositive ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 69, 58, 0.2)';

  // Chart dimensions
  const chartWidth = 360;
  const chartHeight = height - 32; // Padding
  const padding = { top: 16, right: 8, bottom: 16, left: 8 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Generate path points
  const points = prices.map((price, index) => {
    const x = padding.left + (index / (prices.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((price - minPrice) / priceRange) * graphHeight;
    return { x, y };
  });

  // Create line path
  const linePath = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      // Use bezier curves for smooth lines
      const prevPoint = points[index - 1];
      const midX = (prevPoint.x + point.x) / 2;
      return `C ${midX} ${prevPoint.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(' ');

  // Create fill path (closes the area under the line)
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <View style={[styles.container, { height }]}>
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Fill area */}
        <Path
          d={fillPath}
          fill="url(#fillGradient)"
        />

        {/* Line */}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  emptyText: {
    color: '#636366',
    fontSize: 14,
  },
});
