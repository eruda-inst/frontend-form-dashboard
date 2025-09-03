import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const access_token = cookieStore.get('access_token')?.value;

    if (!access_token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/usuarios, with access_token: ${access_token}`;
    console.log('Fetching from backend URL:', backendUrl);
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error fetching usuarios:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal Server Error' , error: error}, { status: 500 });
  }
}
