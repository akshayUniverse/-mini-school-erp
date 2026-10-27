import { Router } from 'express';
import { SchoolClass, Student } from '../models.js';
import { allow } from '../middleware.js';

const router = Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: escaped, $options: 'i' };
  }
  const students = await Student.find(filter).populate('classId', 'name section').sort({ name: 1 });
  return res.json(students);
});

router.post('/', allow('admin'), async (req, res) => {
  const { name, rollNo, classId, guardianContact = '' } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof rollNo !== 'string' || !rollNo.trim() || !classId) {
    return res.status(400).json({ message: 'Name, roll number, and class are required' });
  }
  if (!(await SchoolClass.exists({ _id: classId }))) {
    return res.status(400).json({ message: 'Class is invalid' });
  }
  const student = await Student.create({ name, rollNo, classId, guardianContact });
  await student.populate('classId', 'name section');
  return res.status(201).json(student);
});

router.put('/:id', allow('admin'), async (req, res) => {
  const { name, rollNo, classId, guardianContact = '' } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof rollNo !== 'string' || !rollNo.trim() || !classId) {
    return res.status(400).json({ message: 'Name, roll number, and class are required' });
  }
  if (!(await SchoolClass.exists({ _id: classId }))) {
    return res.status(400).json({ message: 'Class is invalid' });
  }
  const student = await Student.findByIdAndUpdate(
    req.params.id, { name, rollNo, classId, guardianContact }, { new: true, runValidators: true }
  ).populate('classId', 'name section');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  return res.json(student);
});

router.delete('/:id', allow('admin'), async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  return res.status(204).end();
});

export default router;
