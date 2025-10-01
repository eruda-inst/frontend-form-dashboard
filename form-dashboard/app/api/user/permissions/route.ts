import { NextRequest, NextResponse } from "next/server";
import { permission } from "process";

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get("access_token")?.value;
  const userCookie = req.cookies.get("user")?.value;

  if (!accessToken || !userCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = JSON.parse(userCookie);
    const userId = user.id;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${userId}/permissoes`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch permissions" },
        { status: response.status }
      );
    }

    const permissions = await response.json();
    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error("Internal Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}