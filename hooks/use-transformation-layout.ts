/**
 * Responsive layout hook for Transformation screens.
 * Adapts to pixel screens using layout.maxContentWidth and screenPadding,
 * matching the pattern used in journal and home screens.
 */
import { useWindowDimensions } from 'react-native';
import { layout, spacing } from '@/constants/theme';

export function useTransformationLayout() {
  const { width } = useWindowDimensions();

  const paddingHorizontal = layout.screenPadding;
  const contentWidth = Math.min(width, layout.maxContentWidth) - paddingHorizontal * 2;
  const chartWidth = contentWidth;

  return {
    width,
    paddingHorizontal,
    contentWidth,
    chartWidth,
    /** Style for ScrollView contentContainerStyle - pixel-consistent, matches layout.screenPadding */
    scrollContentStyle: {
      paddingHorizontal,
      paddingBottom: spacing.huge,
      paddingTop: spacing.lg,
    },
  };
}
