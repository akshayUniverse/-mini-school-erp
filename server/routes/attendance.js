import { Router } from 'express';
import { Attendance, SchoolClass, Student } from '../models.js';
import { allow } from '../middleware.js';

const router = Router();

export function indiaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
}

router.post('/', allow('teacher'), async (req, res) => {
  const { classId, records } = req.body ?? {};
  if (!classId || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Class and attendance records are required' });
  }
  const classItem = await SchoolClass.findById(classId);
  if (!classItem) return res.status(404).json({ message: 'Class not found' });
  if (String(classItem.teacher) !== req.user.id) {
    return res.status(403).json({ message: 'You can only mark attendance for your own classes' });
  }

  const studentIds = records.map((record) => record?.student);
  if (records.some((record) => !record?.student || !['present', 'absent'].includes(record.status)) ||
      new Set(studentIds.map(String)).size !== studentIds.length) {
    return res.status(400).json({ message: 'Each student must have one valid attendance status' });
  }
  const currentStudents = await Student.find({ classId }).select('_id');
  const allowedIds = new Set(currentStudents.map((student) => String(student._id)));
  if (studentIds.some((id) => !allowedIds.has(String(id))) || studentIds.length !== allowedIds.size) {
    return res.status(400).json({ message: 'Attendance must include every student in the selected class' });
  }

  const attendance = await Attendance.findOneAndUpdate(
    { classId, date: indiaDate() },
    { $set: { records: records.map(({ student, status }) => ({ student, status })), markedBy: req.user.id } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('classId', 'name section').populate('records.student', 'name rollNo');
  return res.json(attendance);
});

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.query.date) filter.date = req.query.date;
  if (req.query.studentId) filter['records.student'] = req.query.studentId;
  const attendance = await Attendance.find(filter)
    .populate('classId', 'name section')
    .populate('records.student', 'name rollNo')
    .populate('markedBy', 'name')
    .sort({ date: -1, updatedAt: -1 });
  if (req.query.studentId) {
    return res.json(attendance.map((item) => ({
      ...item.toObject(),
      records: item.records.filter((record) => String(record.student?._id) === req.query.studentId)
    })));
  }
  return res.json(attendance);
});

export default router;
