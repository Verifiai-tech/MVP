import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';

export const auditLog = (action: string, resourceType?: string, getResourceId?: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function (data: unknown) {
      if (req.user && res.statusCode < 400) {
        const resourceId = getResourceId?.(req);
        query(
          `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.user.userId, action, resourceType || null, resourceId || null, req.ip || req.socket.remoteAddress]
        ).catch(console.error);
      }
      return originalSend.call(this, data);
    };
    next();
  };
};
