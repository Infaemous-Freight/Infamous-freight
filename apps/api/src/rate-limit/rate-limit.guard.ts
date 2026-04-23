import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { RateLimitService } from './rate-limit.service';
import { Reflector } from '@nestjs/core';
import { SKIP_RATE_LIMIT_KEY } from './skip-rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private rateLimitService: RateLimitService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.API_RATE_LIMIT_ENABLED === 'false') {
      return true;
    }

    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipRateLimit) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const clientId = this.getClientId(request);

    const isAuthEndpoint = request.path.includes('/auth/') || request.path.includes('/login');
    const result = isAuthEndpoint
      ? await this.rateLimitService.checkAuthLimit(clientId)
      : await this.rateLimitService.checkApiLimit(clientId);

    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', isAuthEndpoint ? 5 : 60);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.resetAt);

    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientId(request: Request): string {
    const userId = (request as any).user?.id;
    if (userId) return `user:${userId}`;

    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    return `ip:${ip}`;
  }
}
