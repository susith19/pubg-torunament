import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// ✅ CREATE PAYMENT
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const formData = await req.formData();

    const tournament_id = Number(formData.get("tournament_id"));
    const amount = Number(formData.get("amount"));
    const method = String(formData.get("method"));
    const transaction_id = String(formData.get("transaction_id"));
    const file = formData.get("screenshot") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Screenshot required" },
        { status: 400 }
      );
    }

    // ✅ Convert file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Create filename
    const fileName = `${Date.now()}-${file.name}`;
    const uploadPath = path.join(
      process.cwd(),
      "public/uploads/payments",
      fileName
    );

    // ✅ Save file
    fs.writeFileSync(uploadPath, buffer);

    const fileUrl = `/uploads/payments/${fileName}`;

    // ✅ Insert DB (Prisma)
    const payment = await prisma.payment.create({
      data: {
        user_id: Number(user.id),
        tournament_id,
        amount,
        method,
        transaction_id,
        screenshot_url: fileUrl,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      screenshot_url: fileUrl,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Payment failed" },
      { status: 500 }
    );
  }
}


// ✅ GET PAYMENTS
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const data = await prisma.payment.findMany({
    where: {
      user_id: Number(user.id),
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return NextResponse.json({ success: true, data });
}