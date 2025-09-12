import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendanceService';
import { handleError } from '../utils/errorHandler';
import { AuthRequest } from '../types/auth';

// Create single attendance record
export const createAttendanceRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enrollmentId, date, status, note } = req.body;
    const recordedBy = req.user?.userId;

    const record = await AttendanceService.createAttendanceRecord({
      enrollmentId,
      date,
      status,
      note,
      recordedBy,
    });

    res.status(201).json({
      success: true,
      data: record,
      message: 'Attendance record created successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Bulk create/update attendance for a group
export const bulkCreateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupId, date, attendanceRecords } = req.body;
    const recordedBy = req.user?.userId;

    const records = await AttendanceService.bulkCreateAttendance(
      { groupId, date, attendanceRecords },
      recordedBy
    );

    res.status(201).json({
      success: true,
      data: records,
      message: 'Attendance records saved successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Get current week attendance for a group (with prefilling logic)
export const getGroupCurrentWeekAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const centerId = req.user?.centerId;

    if (!centerId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. User must be associated with a center.',
        errors: ['No center association'],
      });
      return;
    }

    const weekAttendance = await AttendanceService.getGroupCurrentWeekAttendance(groupId, centerId);

    res.json({
      success: true,
      data: weekAttendance,
      message: 'Group current week attendance retrieved successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Get group attendance by specific date
export const getGroupAttendanceByDate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupId, date } = req.params;
    const centerId = req.user?.centerId;

    if (!centerId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. User must be associated with a center.',
        errors: ['No center association'],
      });
      return;
    }

    const records = await AttendanceService.getGroupAttendanceByDate(groupId, date, centerId);

    res.json({
      success: true,
      data: records,
      message: 'Group attendance for date retrieved successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Check if today is a class day for a group
export const checkGroupClassToday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const centerId = req.user?.centerId;

    if (!centerId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. User must be associated with a center.',
        errors: ['No center association'],
      });
      return;
    }

    const classInfo = await AttendanceService.isGroupClassToday(groupId, centerId);

    res.json({
      success: true,
      data: classInfo,
      message: 'Group class schedule checked successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Get attendance by enrollment
export const getAttendanceByEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { enrollmentId } = req.params;
    const { startDate, endDate } = req.query;

    const records = await AttendanceService.getAttendanceByEnrollment(
      enrollmentId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: records,
      message: 'Attendance records retrieved successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Get attendance by group
export const getAttendanceByGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;

    const records = await AttendanceService.getAttendanceByGroup(
      groupId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: records,
      message: 'Group attendance records retrieved successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Get attendance by student
export const getAttendanceByStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const records = await AttendanceService.getAttendanceByStudent(
      studentId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: records,
      message: 'Student attendance records retrieved successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Update attendance record
export const updateAttendanceRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const record = await AttendanceService.updateAttendanceRecord(id, {
      status,
      note,
    });

    res.json({
      success: true,
      data: record,
      message: 'Attendance record updated successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Delete attendance record
export const deleteAttendanceRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await AttendanceService.deleteAttendanceRecord(id);

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};

// Get attendance statistics for a group
export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;

    const stats = await AttendanceService.getAttendanceStats(
      groupId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: stats,
      message: 'Attendance statistics retrieved successfully',
    });
  } catch (error) {
    const errorInfo = handleError(error as Error);
    res.status(errorInfo.statusCode).json({
      success: false,
      message: errorInfo.message,
    });
  }
};