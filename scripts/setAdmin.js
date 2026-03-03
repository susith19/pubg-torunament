import dotenv from "dotenv";
import path from "path";
import admin from "firebase-admin";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// ✅ Load ENV
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

// ✅ Debug
console.log("ENV CHECK:", {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
});

console.log("DB URL:", process.env.DATABASE_URL);

// ✅ 🔥 Correct adapter
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// ✅ Firebase init
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const adminAuth = admin.auth();

async function setAdmin() {
  try {
    const uid = "QofQ0OkNfqO2xlmP9tVYUqoKWqZ2";

    const user = await prisma.user.findUnique({
      where: { uid },
    });

    if (!user) {
      console.error("❌ User not found in DB");
      return;
    }

    await prisma.user.update({
      where: { uid },
      data: {
        role: "admin",
        updated_at: new Date(),
      },
    });

    const existingUser = await adminAuth.getUser(uid);

    await adminAuth.setCustomUserClaims(uid, {
      ...existingUser.customClaims,
      role: "admin",
    });

    console.log("✅ Admin role set in DB + Firebase");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();