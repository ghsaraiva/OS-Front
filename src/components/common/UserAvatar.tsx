import React from 'react';
import { getInitials, getUserAvatarUrl } from '../../utils/userUtils';

interface UserAvatarProps {
  user?: { id?: string; name?: string; avatar?: string };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs font-semibold',
  md: 'h-10 w-10 text-sm font-semibold',
  lg: 'h-16 w-16 text-xl font-bold',
  xl: 'h-24 w-24 text-3xl font-bold',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'sm', className = '' }) => {
  const avatarUrl = getUserAvatarUrl(user);
  const initials = getInitials(user?.name);
  const dimensionClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name || 'Avatar'}
        className={`rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700 ${dimensionClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 border border-brand-500/20 shrink-0 select-none ${dimensionClass} ${className}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
