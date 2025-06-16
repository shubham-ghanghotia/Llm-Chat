import { type Request, type Response, type NextFunction } from 'express';

export const headers = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // The return type should be `void`
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE');
    res.status(200).json({});
  }

  next();
};