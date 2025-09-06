// utils/constants.js
export const USER_ROLES = {
  SYSTEM_ADMIN: 'SystemAdmin',
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  AGENT: 'Agent'
};

export const TASK_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
};

export const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

export const STATUS_COLORS = {
  [TASK_STATUS.PENDING]: 'info',
  [TASK_STATUS.IN_PROGRESS]: 'warning',
  [TASK_STATUS.COMPLETED]: 'success',
  [TASK_STATUS.CANCELLED]: 'error',
  [LEAVE_STATUS.PENDING]: 'info',
  [LEAVE_STATUS.APPROVED]: 'success',
  [LEAVE_STATUS.REJECTED]: 'error'
};

export const PRIORITY_COLORS = {
  [TASK_PRIORITY.LOW]: 'success',
  [TASK_PRIORITY.MEDIUM]: 'warning',
  [TASK_PRIORITY.HIGH]: 'error',
  [TASK_PRIORITY.URGENT]: 'error'
};