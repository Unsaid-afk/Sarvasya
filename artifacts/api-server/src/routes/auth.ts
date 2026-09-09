import { Router, type IRouter } from "express";
import crypto from "crypto";
import { getDB, saveDB, type UserRecord } from "../lib/db";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "sarvasya_secure_secret_key_2026";

// Secure PBKDF2 Password Hashing
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash.includes(":")) {
    // Fallback for legacy demo passwords
    return password === storedHash;
  }
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

// Secure HMAC-SHA256 Token Signatures
export function createToken(userId: string, role: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ userId, role, iat: Date.now(), exp: Date.now() + 86400000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function parseToken(token: string): { userId: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const [header, payload, signature] = parts;
      const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
      if (signature !== expectedSig) return null;

      const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (data.exp && Date.now() > data.exp) return null;
      return { userId: data.userId, role: data.role };
    }
    // Fallback legacy Base64 parser support
    const raw = Buffer.from(token, "base64").toString("utf8");
    const parsed = JSON.parse(raw);
    return parsed.userId ? { userId: parsed.userId, role: "citizen" } : null;
  } catch {
    return null;
  }
}

router.post("/auth/register", (req, res): void => {
  const { email, password, name, role = "citizen" } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: "Email, password, and name are required." });
    return;
  }

  const db = getDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: "User with this email already exists." });
    return;
  }

  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    email,
    passwordHash: hashPassword(password),
    name,
    role,
    fakeStrikes: 0,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDB(db);

  const token = createToken(newUser.id, newUser.role);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      fakeStrikes: newUser.fakeStrikes,
    },
  });
});

router.post("/auth/login", (req, res): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const db = getDB();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && verifyPassword(password, u.passwordHash)
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = createToken(user.id, user.role);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      fakeStrikes: user.fakeStrikes,
    },
  });
});

router.get("/auth/me", (req, res): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Unauthorized: Missing token." });
    return;
  }

  const payload = parseToken(token);
  if (!payload?.userId) {
    res.status(401).json({ error: "Unauthorized: Invalid token." });
    return;
  }

  const db = getDB();
  const user = db.users.find((u) => u.id === payload.userId);

  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      fakeStrikes: user.fakeStrikes,
    },
  });
});

export default router;

