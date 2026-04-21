export interface User {
  id: number;
  fullName: string;
  nickname: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}
