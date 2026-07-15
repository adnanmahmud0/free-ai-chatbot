import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Failed to get chat:', error);
    return NextResponse.json({ error: 'Failed to get chat' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    await dbConnect();
    const chat = await Chat.findByIdAndUpdate(
      id, 
      { messages: body.messages },
      { new: true }
    );
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Failed to update chat:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const deletedChat = await Chat.findByIdAndDelete(id);
    
    if (!deletedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
