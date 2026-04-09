import { adminDb } from '@/lib/firebaseAdmin';
import {
  createDefaultRoleOptions,
  type DepartmentOption,
  type ManagedRole,
  type RoleAuditRecord,
  type RoleOption,
  type RoleOptionsConfig,
} from '@/lib/roleOptions';

type RoleOptionsInput = {
  roles?: unknown;
  departments?: unknown;
};

type Actor = {
  uid: string;
  email: string;
};

type RoleAuditInput = Omit<RoleAuditRecord, 'id' | 'changedAt'> & {
  changedAt?: string;
};

function isManagedRole(value: unknown): value is ManagedRole {
  return value === 'admin' || value === 'teacher' || value === 'student';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeRoleOption(value: unknown): RoleOption | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<RoleOption>;
  if (!isManagedRole(candidate.value)) return null;

  return {
    value: candidate.value,
    label: isNonEmptyString(candidate.label) ? candidate.label.trim() : candidate.value,
    description: isNonEmptyString(candidate.description)
      ? candidate.description.trim()
      : `Role permissions for ${candidate.value}`,
    enabled: candidate.enabled !== false,
  };
}

function normalizeDepartmentOption(value: unknown): DepartmentOption | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<DepartmentOption>;
  if (!isNonEmptyString(candidate.value)) return null;

  const normalizedValue = candidate.value.trim().toLowerCase();
  const label = isNonEmptyString(candidate.label)
    ? candidate.label.trim()
    : normalizedValue
        .split('-')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

  return {
    value: normalizedValue,
    label,
  };
}

function normalizeRoleOptions(input: unknown, actor?: Actor): RoleOptionsConfig {
  const defaults = createDefaultRoleOptions();
  const source = input && typeof input === 'object' ? (input as RoleOptionsInput) : {};

  const roleList = Array.isArray(source.roles) ? source.roles : defaults.roles;
  const departmentList = Array.isArray(source.departments)
    ? source.departments
    : defaults.departments;

  const normalizedRoles = roleList
    .map(normalizeRoleOption)
    .filter((option): option is RoleOption => Boolean(option));

  const normalizedDepartments = departmentList
    .map(normalizeDepartmentOption)
    .filter((option): option is DepartmentOption => Boolean(option));

  return {
    roles: normalizedRoles.length > 0 ? normalizedRoles : defaults.roles,
    departments: normalizedDepartments.length > 0 ? normalizedDepartments : defaults.departments,
    updatedAt: new Date().toISOString(),
    updatedByUid: actor?.uid,
    updatedByEmail: actor?.email,
  };
}

export function resolveCurrentRole(
  explicitRole: unknown,
  flags: { hasAdmin: boolean; hasTeacher: boolean; hasStudent: boolean }
): ManagedRole | 'none' {
  if (isManagedRole(explicitRole)) return explicitRole;
  if (flags.hasAdmin) return 'admin';
  if (flags.hasTeacher) return 'teacher';
  if (flags.hasStudent) return 'student';
  return 'none';
}

export async function ensureRoleOptions(): Promise<RoleOptionsConfig> {
  const ref = adminDb.ref('roleOptions');
  const snapshot = await ref.get();

  if (!snapshot.exists()) {
    const defaults = createDefaultRoleOptions();
    await ref.set(defaults);
    return defaults;
  }

  const normalized = normalizeRoleOptions(snapshot.val());
  await ref.set(normalized);
  return normalized;
}

export async function saveRoleOptions(input: unknown, actor: Actor): Promise<RoleOptionsConfig> {
  const normalized = normalizeRoleOptions(input, actor);
  await adminDb.ref('roleOptions').set(normalized);
  return normalized;
}

export async function recordRoleAudit(input: RoleAuditInput): Promise<void> {
  const auditRef = adminDb.ref('adminRoleChanges').push();

  const payload: RoleAuditRecord = {
    id: auditRef.key || `audit-${Date.now()}`,
    targetUid: input.targetUid,
    targetEmail: input.targetEmail,
    targetDisplayName: input.targetDisplayName,
    fromRole: input.fromRole,
    toRole: input.toRole,
    changedByUid: input.changedByUid,
    changedByEmail: input.changedByEmail,
    changedAt: input.changedAt || new Date().toISOString(),
    reason: input.reason,
  };

  await auditRef.set(payload);
}

export async function listRoleAudits(limit = 30): Promise<RoleAuditRecord[]> {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 200) : 30;
  const snapshot = await adminDb.ref('adminRoleChanges').get();

  if (!snapshot.exists()) {
    return [];
  }

  const rows: RoleAuditRecord[] = [];
  snapshot.forEach((child) => {
    const value = child.val() as Partial<RoleAuditRecord>;
    if (
      value &&
      isNonEmptyString(value.targetUid) &&
      isNonEmptyString(value.targetEmail) &&
      isNonEmptyString(value.targetDisplayName) &&
      (isManagedRole(value.fromRole) || value.fromRole === 'none') &&
      isManagedRole(value.toRole) &&
      isNonEmptyString(value.changedByUid) &&
      isNonEmptyString(value.changedByEmail) &&
      isNonEmptyString(value.changedAt)
    ) {
      rows.push({
        id: isNonEmptyString(value.id) ? value.id : child.key || `audit-${rows.length}`,
        targetUid: value.targetUid,
        targetEmail: value.targetEmail,
        targetDisplayName: value.targetDisplayName,
        fromRole: value.fromRole,
        toRole: value.toRole,
        changedByUid: value.changedByUid,
        changedByEmail: value.changedByEmail,
        changedAt: value.changedAt,
        reason: isNonEmptyString(value.reason) ? value.reason : undefined,
      });
    }
  });

  return rows
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
    .slice(0, safeLimit);
}
