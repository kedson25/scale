import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { endpoint, payload } = body;

    if (!endpoint) {
      return NextResponse.json({ message: 'Endpoint is required' }, { status: 400 });
    }

    const baseUrl = 'https://apipush.onrender.com';
    const targetUrl = `${baseUrl}${endpoint}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text, error: !response.ok };
      if (!response.ok) {
        console.warn(`External push API returned non-JSON error: ${text}`);
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Proxy Push Error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
