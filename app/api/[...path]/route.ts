import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8787";

async function proxyRequest(request: NextRequest, path: string) {
  const workerUrl = `${WORKER_URL}${path}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }
  
  try {
    const response = await fetch(workerUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined,
    });
    
    const data = await response.json().catch(() => null);
    return NextResponse.json(data || {}, { status: response.status });
  } catch (error) {
    console.error(`API proxy error:`, error);
    return NextResponse.json(
      { error: "Failed to proxy request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { pathname, search } = new URL(request.url);
  return proxyRequest(request, `${pathname.replace("/api", "")}${search}`);
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  return proxyRequest(request, pathname.replace("/api", ""));
}

export async function PUT(request: NextRequest) {
  const { pathname } = new URL(request.url);
  return proxyRequest(request, pathname.replace("/api", ""));
}

export async function DELETE(request: NextRequest) {
  const { pathname } = new URL(request.url);
  return proxyRequest(request, pathname.replace("/api", ""));
}
