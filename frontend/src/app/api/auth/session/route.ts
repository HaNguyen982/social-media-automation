import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await validateAdminAuth(request);

  if (auth.authenticated) {
    return NextResponse.json({
      authenticated: true,
      role: "admin",
      user: {
        name: "Quản trị viên Hệ thống",
        role: "ADMIN",
        title: "Chuyên viên Kiểm định / Quản trị",
      },
    });
  }

  return NextResponse.json({
    authenticated: false,
    role: null,
    reason: auth.reason,
  });
}
