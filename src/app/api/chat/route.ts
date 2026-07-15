import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { chatId, messages, newUserMessage } = await req.json();
    
    await dbConnect();
    
    let chat = null;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      
      // Update title if it's the first user message and title is default
      if (chat.title === 'New Chat' && newUserMessage) {
        chat.title = newUserMessage.content.substring(0, 30) + (newUserMessage.content.length > 30 ? '...' : '');
      }
      
      if (newUserMessage) {
        chat.messages.push({
          role: 'user',
          content: newUserMessage.content,
          meta: newUserMessage.meta
        });
        await chat.save();
      }
    }
    let openRouterMessages = messages;

    if (chat) {
      // Use the database as the source of truth for memory
      openRouterMessages = chat.messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));
    }

    // Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTERAPIKEYS}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.MODEL || "openrouter/free",
        messages: openRouterMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json({ error: "Failed to fetch from OpenRouter" }, { status: response.status });
    }

    const data = await response.json();
    const botReplyText = data.choices[0].message.content;
    const botReplyMeta = `TRAILHEAD · WAYPOINT ${String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')}`;

    if (chat) {
      chat.messages.push({
        role: 'bot',
        content: botReplyText,
        meta: botReplyMeta
      });
      await chat.save();
    }

    return NextResponse.json({ reply: botReplyText, meta: botReplyMeta });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
