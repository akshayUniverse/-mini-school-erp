import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, SchoolClass, Student } from './models.js';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured');

await mongoose.connect(process.env.MONGODB_URI);
try {
  const adminHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);
  await User.updateOne(
    { email: 'admin@school.com' },
    { $set: { name: 'School Admin', email: 'admin@school.com', role: 'admin', passwordHash: adminHash } },
    { upsert: true }
  );
  await User.updateOne(
    { email: 'teacher@school.com' },
    { $set: { name: 'Demo Teacher', email: 'teacher@school.com', role: 'teacher', subject: 'Mathematics', phone: '', passwordHash: teacherHash } },
    { upsert: true }
  );
  const teacher = await User.findOne({ email: 'teacher@school.com' });
  const classItem = await SchoolClass.findOneAndUpdate(
    { name: 'Grade 6', section: 'A' },
    { $set: { teacher: teacher._id } },
    { upsert: true, new: true, runValidators: true }
  );
  const roster = [
    ['Aarav Sharma', '1'], ['Diya Patel', '2'], ['Kabir Singh', '3'],
    ['Meera Nair', '4'], ['Rohan Gupta', '5']
  ];
  for (const [name, rollNo] of roster) {
    await Student.updateOne(
      { classId: classItem._id, rollNo },
      { $setOnInsert: { name, rollNo, classId: classItem._id, guardianContact: '' } },
      { upsert: true }
    );
  }
  console.log('Demo data seeded successfully.');
} finally {
  await mongoose.disconnect();
}
