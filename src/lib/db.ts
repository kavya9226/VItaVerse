import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  phone?: string;
  phoneVerified?: boolean;
  otp?: string;
  otpExpiry?: string;
  stravaId?: string;
  stravaAccessToken?: string;
  stravaRefreshToken?: string;
  stravaTokenExpiry?: string;
  stravaAthleteId?: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetDistance: number;
  activityType: "Run" | "Ride" | "Walk" | "Any";
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
}

export interface Verification {
  id: string;
  userId: string;
  challengeId: string;
  token: string;
  status: "pending" | "verified" | "failed";
  distanceAchieved?: number;
  completedAt?: string;
  qrCode?: string;
  verifiedAt?: string;
  createdAt: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDB<T>(collection: string): T[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T[];
  } catch {
    return [];
  }
}

export function writeDB<T>(collection: string, data: T[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function getUser(email: string): User | undefined {
  const users = readDB<User>("users");
  return users.find((user) => user.email === email);
}

export function createUser(userData: Omit<User, "id" | "createdAt">): User {
  const users = readDB<User>("users");
  const newUser: User = {
    ...userData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeDB("users", users);
  return newUser;
}

export function updateUser(
  email: string,
  updates: Partial<Omit<User, "id" | "email">>
): User | undefined {
  const users = readDB<User>("users");
  const index = users.findIndex((user) => user.email === email);
  if (index === -1) return undefined;
  users[index] = { ...users[index], ...updates };
  writeDB("users", users);
  return users[index];
}
