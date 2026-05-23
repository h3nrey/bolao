// User DTO definitions
export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: Date;
  updated_at: Date;
}
