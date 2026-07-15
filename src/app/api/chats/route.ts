import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const chats = await Chat.find({}).sort({ updatedAt: -1 }).select('title updatedAt');
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Failed to get chats:', error);
    return NextResponse.json({ error: 'Failed to get chats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Create a new, empty chat
    const chat = await Chat.create({ title: 'New Chat', messages: [] });
    
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Failed to create chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
