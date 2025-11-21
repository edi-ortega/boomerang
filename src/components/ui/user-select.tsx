import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  email: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  avatar_color?: string;
  is_super_admin?: boolean;
}

interface UserSelectProps {
  users: User[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  filterEmails?: string[];
}

const getUserDisplayInfo = (user: User) => {
  const displayName = user.full_name || user.name || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();
  const avatarColor = user.avatar_color || '#3b82f6';
  
  return {
    name: displayName,
    initial,
    avatarUrl: user.avatar_url,
    avatarColor
  };
};

const UserAvatar = ({ user }: { user: User }) => {
  const info = getUserDisplayInfo(user);
  
  return info.avatarUrl ? (
    <img
      src={info.avatarUrl}
      alt={info.name}
      className="w-6 h-6 rounded-full object-cover"
    />
  ) : (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
      style={{ backgroundColor: info.avatarColor }}
    >
      {info.initial}
    </div>
  );
};

export function UserSelect({
  users,
  value,
  onValueChange,
  placeholder = "Selecione um usuário",
  className = "",
  disabled = false,
  filterEmails = []
}: UserSelectProps) {
  // Filter out super admins and optionally emails from filterEmails
  const filteredUsers = users.filter(u => {
    if (u.is_super_admin) return false;
    if (filterEmails.length > 0 && filterEmails.includes(u.email)) return false;
    return true;
  });

  const selectedUser = users.find(u => u.email === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`bg-background border-border ${className}`}>
        <SelectValue placeholder={placeholder}>
          {selectedUser && (
            <div className="flex items-center gap-2">
              <UserAvatar user={selectedUser} />
              <span>{getUserDisplayInfo(selectedUser).name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background z-[100]">
        {filteredUsers.map((user) => {
          const info = getUserDisplayInfo(user);
          return (
            <SelectItem key={user.email} value={user.email}>
              <div className="flex items-center gap-2">
                <UserAvatar user={user} />
                <span>{info.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
