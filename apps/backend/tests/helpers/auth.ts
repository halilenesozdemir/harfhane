import { signJwt } from '../../src/utils/auth';

const JWT_EXPIRES_IN = 60 * 60 * 24;

export async function createTestToken(userId: number, secret: string): Promise<string> {
  return signJwt(
    { sub: userId, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN },
    secret
  );
}
