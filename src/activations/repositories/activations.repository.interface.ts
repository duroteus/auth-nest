export interface ActivationToken {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActivationTokenData {
  userId: string;
  expiresAt: Date;
}

export interface IActivationsRepository {
  create(data: CreateActivationTokenData): Promise<ActivationToken>;
  findById(id: string): Promise<ActivationToken | null>;
  findValidByUserId(userId: string): Promise<ActivationToken | null>;
  markAsUsed(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
