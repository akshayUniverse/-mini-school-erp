import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'teacher'], required: true },
  phone: { type: String, trim: true, default: '' },
  subject: { type: String, trim: true, default: '' }
}, { timestamps: true });

const classSchema = new Schema({
  name: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true, uppercase: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });
classSchema.index({ name: 1, section: 1 }, { unique: true });

const studentSchema = new Schema({
  name: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, trim: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  guardianContact: { type: String, trim: true, default: '' }
}, { timestamps: true });
studentSchema.index({ classId: 1, rollNo: 1 }, { unique: true });

const attendanceSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  records: [{
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['present', 'absent'], required: true }
  }],
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
attendanceSchema.index({ classId: 1, date: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
export const SchoolClass = mongoose.model('Class', classSchema);
export const Student = mongoose.model('Student', studentSchema);
export const Attendance = mongoose.model('Attendance', attendanceSchema);
