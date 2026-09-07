import { Router, type IRouter } from "express";
import { getDB, saveDB, type UserRecord } from "../lib/db";

const router: IRouter = Router();

// Helper to simulate token generation
function createToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, issuedAt: Date.now() })).toString("base64");
}

function parseToken(token: string): { userId: string } | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf8");
    return JSON.parse(raw);
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
    passwordHash: password, // In production, hash with bcrypt/argon2
    name,
    role,
    fakeStrikes: 0,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDB(db);

  const token = createToken(newUser.id);
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
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = createToken(user.id);
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
