import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

class AuthRoutes {
  private router: Router;
  private authController: AuthController;

  constructor(authController: AuthController) {
    this.router = Router();
    this.authController = authController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.post('/register', (req, res) => this.authController.register(req, res));
    this.router.post('/login', (req, res) => this.authController.login(req, res));

    // Protected routes
    this.router.get('/profile', authenticateToken, (req, res) => this.authController.getProfile(req, res));
    this.router.put('/profile', authenticateToken, (req, res) => this.authController.updateProfile(req, res));
    this.router.post('/logout', authenticateToken, (req, res) => this.authController.logout(req, res));
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default AuthRoutes;
