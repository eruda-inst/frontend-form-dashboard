import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const backendUrl = new URL(
    `${process.env.NEXT_PUBLIC_API_URL}/formularios/${id}/export`
  );

  searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });
console.log(token)
  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new NextResponse(JSON.stringify(errorData), {
        status: response.status,
      });
    }

    const contentDisposition = response.headers.get("content-disposition");
    const contentType = response.headers.get("content-type");

    const headers = new Headers();
    if (contentDisposition) {
      headers.set("content-disposition", contentDisposition);
    }
    if (contentType) {
      headers.set("content-type", contentType);
    }

    const readableStream = response.body;

    return new NextResponse(readableStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error fetching export:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
