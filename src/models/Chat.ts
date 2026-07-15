import mongoose, { Document, Model } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system' | 'bot';
  content: string;
  meta?: string;
}

export interface IChat extends Document {
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system', 'bot'],
  },
  content: {
    type: String,
    required: true,
  },
  meta: {
    type: String, // e.g., 'YOU · MI 3.2'
  }
});

const ChatSchema = new mongoose.Schema<IChat>({
  title: {
    type: String,
    default: 'New Chat',
  },
  messages: [MessageSchema],
}, { timestamps: true });

const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
export default Chat;
