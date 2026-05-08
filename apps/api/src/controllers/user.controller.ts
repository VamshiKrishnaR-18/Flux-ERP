import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { logActivity } from '../utils/activity';

export const UserController = {
  // Get all users (Admin only)
  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const users = await UserModel.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  }),

  // Update user role (Admin only)
  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = (req.user as any)?.id;

    if (!['admin', 'user'].includes(role)) {
      res.status(400);
      throw new Error("Invalid role");
    }

    // Prevent changing own role (optional safety)
    if (id === adminId) {
      res.status(400);
      throw new Error("You cannot change your own role");
    }

    const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (adminId) {
        await logActivity({
          userId: adminId as any,
          action: 'updated',
          resourceType: 'Settings', // Using Settings as a catch-all for system changes
          resourceId: id,
          resourceName: `User Role: ${user.name}`,
          details: [`Role changed to ${role}`]
        });
    }

    res.json({ success: true, data: user });
  }),

  // Delete user (Admin only)
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = (req.user as any)?.id;

    if (id === adminId) {
      res.status(400);
      throw new Error("You cannot delete yourself");
    }

    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404);
      throw new Error("User not found");
    }

    if (adminId) {
        await logActivity({
          userId: adminId as any,
          action: 'deleted',
          resourceType: 'Settings',
          resourceId: id,
          resourceName: `User: ${deleted.name}`
        });
    }

    res.json({ success: true, message: "User deleted" });
  })
};
