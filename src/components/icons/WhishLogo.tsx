import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export default function WhishLogo(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="whish-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="url(#whish-gradient)"
      />
      <path
        fill="white"
        d="M8 9C8 8.45 8.45 8 9 8h6c.55 0 1 .45 1 1s-.45 1-1 1H9c-.55 0-1-.45-1-1zm0 3c0-.55.45-1 1-1h6c.55 0 1 .45 1 1s-.45 1-1 1H9c-.55 0-1-.45-1-1zm0 3c0-.55.45-1 1-1h4c.55 0 1 .45 1 1s-.45 1-1 1H9c-.55 0-1-.45-1-1z"
      />
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fontSize="3"
        fill="white"
        fontWeight="bold"
      >
        W
      </text>
    </SvgIcon>
  );
}