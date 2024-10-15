import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const password = request.headers.authorization;
    const expectedPassword = process.env.PASSWORD;
    if (!expectedPassword?.length) {
      throw new Error('No password set');
    }
    const isAuthorized = password === expectedPassword;
    if (!isAuthorized) {
      Logger.error('Unauthorized access with password ' + password);
    }
    return isAuthorized;
  }
}
