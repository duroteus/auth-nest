export interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionData {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface ISessionsRepository {
  create(data: CreateSessionData): Promise<Session>;
  findByToken(token: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  deleteByToken(token: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
