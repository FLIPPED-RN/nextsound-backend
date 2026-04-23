import { Role } from '../auth/role.enum';

export interface User {
  id: number;
  fullName: string;
  nickname: string;
  email: string;
  password_hash: string;
  role: Role[];
  created_at: Date;
  updated_at: Date;
}
