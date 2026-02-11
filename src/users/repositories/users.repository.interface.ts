export interface User {
  id: string;
  username: string;
  email: string;
  hashedPassword: string;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  username: string;
  email: string;
  hashedPassword: string;
}

export interface IUsersRepository {
  create(data: CreateUserData): Promise<Omit<User, 'hashedPassword'>>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
}
