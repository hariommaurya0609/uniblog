import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/login
 *
 * Hardcoded admin credentials for scraper access.
 * Returns a simple token (base64 of username:password) on success.
 */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "uniblog@2026";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create a simple token
      const token = Buffer.from(`${username}:${password}`).toString("base64");

      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        token,
      });

      // Also set as httpOnly cookie for SSE endpoint
      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }
}
