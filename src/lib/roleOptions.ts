export type ManagedRole = 'admin' | 'teacher' | 'student';

export type RoleOption = {
  value: ManagedRole;
  label: string;
  description: string;
  enabled: boolean;
};

export type DepartmentOption = {
  value: string;
  label: string;
};

export type RoleOptionsConfig = {
  roles: RoleOption[];
  departments: DepartmentOption[];
  updatedAt: string;
  updatedByUid?: string;
  updatedByEmail?: string;
};

export type RoleAuditRecord = {
  id: string;
  targetUid: string;
  targetEmail: string;
  targetDisplayName: string;
  fromRole: ManagedRole | 'none';
  toRole: ManagedRole;
  changedByUid: string;
  changedByEmail: string;
  changedAt: string;
  reason?: string;
};

export const DEFAULT_ROLE_OPTIONS: Omit<RoleOptionsConfig, 'updatedAt'> = {
  roles: [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Can manage users, roles, and admin dashboard settings.',
      enabled: true,
    },
    {
      value: 'teacher',
      label: 'Teacher',
      description: 'Can create activities, sessions, and review classroom analytics.',
      enabled: true,
    },
    {
      value: 'student',
      label: 'Student',
      description: 'Can join sessions and submit activity responses.',
      enabled: true,
    },
  ],
  departments: [
    { value: 'computer-science', label: 'Computer Science' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'management', label: 'Management' },
  ],
};

function cloneRoleOption(option: RoleOption): RoleOption {
  return {
    value: option.value,
    label: option.label,
    description: option.description,
    enabled: option.enabled,
  };
}

function cloneDepartmentOption(option: DepartmentOption): DepartmentOption {
  return {
    value: option.value,
    label: option.label,
  };
}

export function createDefaultRoleOptions(): RoleOptionsConfig {
  return {
    roles: DEFAULT_ROLE_OPTIONS.roles.map(cloneRoleOption),
    departments: DEFAULT_ROLE_OPTIONS.departments.map(cloneDepartmentOption),
    updatedAt: new Date().toISOString(),
  };
}
