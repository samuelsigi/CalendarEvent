import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEvent extends Document {
  title: string;
  startDateTime: Date; // Combined start date and time
  endDateTime: Date;   // Combined end date and time
  description?: string;
  userId: string; // User
}

const CalendarEventSchema: Schema = new Schema({
  title: { type: String, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  description: { type: String },
  userId: { type: String, required: true },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

export default mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
