import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('query') as string;
    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }
    // Process the query here
    return NextResponse.json({ message: `Received query: ${query}` }, { status: 200 })
}