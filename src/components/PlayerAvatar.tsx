import React from 'react';
import { getPlayerColor, getInitials } from '../names';

interface PlayerAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md';
}

const sizeClasses: Record<NonNullable<PlayerAvatarProps['size']>, string> = {
  xs: 'w-5 h-5 text-[9px] rounded-md',
  sm: 'w-7 h-7 text-[11px] rounded-lg',
  md: 'w-10 h-10 text-sm rounded-xl'
};

/** Colored initials chip — the player's identity mark across all screens. */
export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, size = 'sm' }) => {
  const color = getPlayerColor(name);
  return (
    <span
      aria-hidden="true"
      className={`${sizeClasses[size]} flex items-center justify-center font-bold font-mono-jetbrains flex-shrink-0 select-none`}
      style={{
        backgroundColor: color.bg,
        color: color.fg,
        boxShadow: `inset 0 0 0 1.5px ${color.border}`
      }}
    >
      {getInitials(name)}
    </span>
  );
};
