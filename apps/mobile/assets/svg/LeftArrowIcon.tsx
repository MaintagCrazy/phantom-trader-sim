import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LeftArrowIconProps {
  width?: number;
  height?: number;
  fill?: string;
}

const LeftArrowIcon: React.FC<LeftArrowIconProps> = ({
  width = 24,
  height = 24,
  fill = '#FFFFFF',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19C14.744 19 14.488 18.902 14.293 18.707L8.29301 12.707C7.90201 12.316 7.90201 11.684 8.29301 11.293L14.293 5.29301C14.684 4.90201 15.316 4.90201 15.707 5.29301C16.098 5.68401 16.098 6.31607 15.707 6.70707L10.414 12L15.707 17.293C16.098 17.684 16.098 18.316 15.707 18.707C15.512 18.902 15.256 19 15 19Z"
        fill={fill}
      />
    </Svg>
  );
};

export default LeftArrowIcon;
