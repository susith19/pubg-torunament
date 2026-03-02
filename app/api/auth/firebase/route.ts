import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuth } from "@/lib/firebaseAdmin";

// ✅ Generate referral code
function generateReferralCode(email: string) {
  const base = email.split("@")[0];
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}${random}`.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { token, referral_code } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    // 🔐 Verify Firebase token
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email;
    const name = decoded.name || "";

    if (!email) {
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    // 🔍 Check existing user
    const existing: any = db
      .prepare("SELECT * FROM users WHERE uid = ?")
      .get(uid);

    if (existing) {
      return NextResponse.json(existing);
    }

    // 🎁 Generate unique referral code
    let newCode = generateReferralCode(email);
    while (
      db.prepare("SELECT id FROM users WHERE referral_code = ?").get(newCode)
    ) {
      newCode = generateReferralCode(email);
    }

    // 🎯 Validate referral
    let referrer: any = null;

    if (referral_code) {
      referrer = db
        .prepare("SELECT * FROM users WHERE referral_code = ?")
        .get(referral_code);

      // ❌ Prevent self-referral (edge case safety)
      if (referrer && referrer.uid === uid) {
        referrer = null;
      }
    }

    // ✅ Insert new user
    const result = db
      .prepare(`
        INSERT INTO users 
        (uid, email, name, role, referral_code, referred_by)
        VALUES (?, ?, ?, 'user', ?, ?)
      `)
      .run(uid, email, name, newCode, referrer?.referral_code || null);

    const newUserId = result.lastInsertRowid as number;

    // 🎁 Referral logic (UPDATED)
    if (referrer) {
      const POINTS = 10;

      // ✅ Increase referral count
      db.prepare(`
        UPDATE users 
        SET referral_count = referral_count + 1
        WHERE id = ?
      `).run(referrer.id);

      // ✅ Add points to referrer
      db.prepare(`
        UPDATE users 
        SET total_points = total_points + ?
        WHERE id = ?
      `).run(POINTS, referrer.id);

      // ✅ Add points to new user (optional reward)
      db.prepare(`
        UPDATE users 
        SET total_points = total_points + ?
        WHERE id = ?
      `).run(POINTS, newUserId);

      // ✅ Save referral relation
      db.prepare(`
        INSERT INTO referrals (referrer_id, referred_user_id, points_given)
        VALUES (?, ?, ?)
      `).run(referrer.id, newUserId, POINTS);

      // ✅ Points log (referrer)
      db.prepare(`
        INSERT INTO points (user_id, points, type, reference_id)
        VALUES (?, ?, 'referral', ?)
      `).run(referrer.id, POINTS, newUserId);

      // ✅ Points log (new user)
      db.prepare(`
        INSERT INTO points (user_id, points, type, reference_id)
        VALUES (?, ?, 'referral', ?)
      `).run(newUserId, POINTS, referrer.id);
    }

    // ✅ Final response
    return NextResponse.json({
      success: true,
      user: {
        id: newUserId,
        uid,
        email,
        name,
        referral_code: newCode,
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Auth failed" },
      { status: 401 }
    );
  }
}