import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import City from '@/lib/models/City';

export async function GET() {
  try {
    await connectDB();
    
    // Get all distinct first letters that have cities
    const availableLetters = await City.distinct('firstLetter');
    
    if (availableLetters.length === 0) {
      return NextResponse.json(
        { error: 'No cities found' },
        { status: 404 }
      );
    }
    
    // Pick a random letter
    const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
    
    return NextResponse.json({ letter: randomLetter }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
      }
    });
    
  } catch (error) {
    console.error('Error getting random letter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 