import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import City from '@/lib/models/City';

export async function GET(
  request: NextRequest,
  { params }: { params: { letter: string } }
) {
  try {
    await connectDB();
    
    const { letter } = params;
    
    // Validate letter parameter
    if (!letter || letter.length !== 1 || !/[a-z]/i.test(letter)) {
      return NextResponse.json(
        { error: 'Invalid letter parameter. Must be a single letter a-z.' },
        { status: 400 }
      );
    }
    
    // Find cities starting with the specified letter
    const cities = await City.find({ 
      firstLetter: letter.toLowerCase() 
    }).select('id displayName country').lean();
    
    return NextResponse.json(cities, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    });
    
  } catch (error) {
    console.error('Error fetching cities by letter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 