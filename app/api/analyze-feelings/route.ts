import { NextResponse } from 'next/server';
import { extractThemesFromInput } from '../../../agent';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Extract themes from the user's message
    const themes = await extractThemesFromInput(message);
    
    // Call the Python API
    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        themes
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API error:', errorText);
      throw new Error(`Python API error: ${errorText}`);
    }

    const result = await response.json();
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error analyzing feelings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze feelings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}