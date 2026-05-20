import { SetMetadata } from '@nestjs/common';
import { EmployeeRole } from '@prisma/client';

export type AppRole = EmployeeRole | 'GUEST';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
