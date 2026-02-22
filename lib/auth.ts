import { verifyToken } from "./jwt";

export function requireAuth(req: any) {
  const auth = req.headers.get("authorization");

  if (!auth) throw new Error("No token");

  const token = auth.split(" ")[1];

  return verifyToken(token);
}