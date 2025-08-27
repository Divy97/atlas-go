import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import City from '@/lib/models/City';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    // Search cities by name (case-insensitive)
    const cities = await City.find({
      $or: [
        { displayName: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
    .select('id displayName country')
    .limit(Math.min(limit, 100)) // Cap at 100 results
    .lean();
    
    return NextResponse.json(cities, {
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600'
      }
    });
    
  } catch (error) {
    console.error('Error searching cities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 