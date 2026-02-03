/**
 * Auth service - Business logic for authentication
 */

import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { LoginCredentials, RegisterData, AuthResult } from '../types/auth.types';
import { NotFoundError, UnauthorizedError } from '@/src/shared/utils/errors';
import { logger } from '@/src/shared/utils/logger';

export class AuthService {
  private userRepository: UserRepository;
  private tokenService: TokenService;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenService = new TokenService();
  }

  async login(credentials: LoginCredentials, ip?: string): Promise<AuthResult> {
    // Find user by email
    const user = await this.userRepository.findByEmail(credentials.email);
    
    if (!user) {
      logger.security('Failed login attempt - user not found', {
        email: credentials.email,
        ip,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // PHASE 6: Reject password login for Google users
    if (user.provider === 'google') {
      logger.security('Failed login attempt - Google user tried password login', {
        email: credentials.email,
        userId: user.id,
        ip,
      });
      throw new UnauthorizedError('This account uses Google login. Please sign in with Google.');
    }

    // Verify password exists
    if (!user.password) {
      logger.security('Failed login attempt - no password set', {
        email: credentials.email,
        userId: user.id,
        ip,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!isValidPassword) {
      logger.security('Failed login attempt - invalid password', {
        email: credentials.email,
        userId: user.id,
        ip,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      ip,
    });

    // Generate token
    const token = this.tokenService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider || 'local',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  async register(data: RegisterData, ip?: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    
    if (existingUser) {
      throw new UnauthorizedError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with local provider
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      role: 'USER',
      provider: 'local',
    });

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      ip,
    });

    // Generate token
    const token = this.tokenService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      provider: 'local',
    });

    return {
      user,
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  getTokenService(): TokenService {
    return this.tokenService;
  }
}

