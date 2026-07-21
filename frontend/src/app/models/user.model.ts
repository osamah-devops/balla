export type UserRole = 'admin' | 'seller' | 'customer';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
  zipCode: string;
  state: string;
  profileImageUrl?: string;
  /** Present when role is 'seller'; links to Owner.id in owners.json */
  ownerId?: string;
}

export interface UpdateProfileRequest {
  name: string;
  zipCode: string;
  state: string;
}
