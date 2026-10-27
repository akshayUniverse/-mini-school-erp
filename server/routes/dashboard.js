import { Router } from 'express';
import { Attendance, SchoolClass, Student, User } from '../models.js';
import { indiaDate } from './attendance.js';

const router = Router();

router.get('/', async (req, res) => {
  const [totalStudents, teachers, classes, today, enrollment] = await Promise.all([
    Student.countDocuments(),
    User.countDocuments({ role: 'teacher' }),
    SchoolClass.find().sort({ name: 1, section: 1 }),
    Attendance.find({ date: indiaDate() }),
    Student.aggregate([{ $group: { _id: '$classId', total: { $sum: 1 } } }])
  ]);
  const attendanceMap = new Map(today.map((item) => [String(item.classId), item]));
  const enrollmentMap = new Map(enrollment.map((item) => [String(item._id), item.total]));
  const attendanceByClass = classes.map((item) => {
    const record = attendanceMap.get(String(item._id));
    return {
      class: item,
      present: record ? record.records.filter((entry) => entry.status === 'present').length : 0,
      total: record?.records.length ?? enrollmentMap.get(String(item._id)) ?? 0
    };
  });
  return res.json({ totalStudents, teachers, classes: classes.length, attendance: attendanceByClass });
});

export default router;
