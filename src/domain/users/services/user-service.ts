import jwt, { JwtPayload } from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'replace_me';
export const JWT_EXPIRES_IN = '14d';


export const getUserIdFromToken = (token: string): string | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.sub;
  } catch {
    return null;
  }
}