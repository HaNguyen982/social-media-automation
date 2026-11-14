import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieOptions = getSessionCookieOptions();

  const response = NextResponse.json({
    success: true,
    message: "Đã đăng xuất thành công.",
  });

  // Clear session cookie
  response.cookies.set(cookieOptions.name, "", {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
