import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export default function BinanceLogo(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        fill="#F0B90B"
        d="M12 2L8.09 5.91L12 9.82L15.91 5.91L12 2Z"
      />
      <path
        fill="#F0B90B"
        d="M3.82 8.09L0 12L3.82 15.91L7.73 12L3.82 8.09Z"
      />
      <path
        fill="#F0B90B"
        d="M16.27 12L20.18 8.09L24 12L20.18 15.91L16.27 12Z"
      />
      <path
        fill="#F0B90B"
        d="M8.09 18.09L12 22L15.91 18.09L12 14.18L8.09 18.09Z"
      />
      <path
        fill="#F0B90B"
        d="M12 6.36L9.64 8.73L12 11.09L14.36 8.73L12 6.36Z"
      />
    </SvgIcon>
  );
}