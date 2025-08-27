import mongoose, { Document, Schema } from 'mongoose';

export interface ICity extends Document {
  id: string;
  name: string;
  displayName: string;
  country: string;
  countryCode: string;
  stateId?: string;
  latitude: number;
  longitude: number;
  firstLetter: string;
  lastLetter: string;
}

const CitySchema = new Schema<ICity>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  country: { type: String, required: true },
  countryCode: { type: String, required: true },
  stateId: { type: String },
  latitude: { type: Number, default: 0 }, // Changed: not required, default to 0
  longitude: { type: Number, default: 0 }, // Changed: not required, default to 0
  firstLetter: { type: String, required: true, index: true },
  lastLetter: { type: String, required: true },
}, {
  timestamps: false,
  versionKey: false
});

// Add indexes for performance
CitySchema.index({ firstLetter: 1 });
CitySchema.index({ country: 1 });
CitySchema.index({ name: 1 });
CitySchema.index({ displayName: 'text' }); // For text search

export default mongoose.models.City || mongoose.model<ICity>('City', CitySchema); 