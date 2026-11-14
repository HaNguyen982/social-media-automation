import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const expectedKey =
            this.configService.get<string>('INTERNAL_API_KEY');

        if (!expectedKey || expectedKey.length < 32) {
            throw new InternalServerErrorException(
                'Internal API authentication is not configured',
            );
        }

        const request = context.switchToHttp().getRequest<Request>();
        const providedKey = request.header('x-api-key');

        if (!providedKey) {
            throw new UnauthorizedException('Missing API key');
        }

        const expectedBuffer = Buffer.from(expectedKey, 'utf8');
        const providedBuffer = Buffer.from(providedKey, 'utf8');

        if (
            expectedBuffer.length !== providedBuffer.length ||
            !timingSafeEqual(expectedBuffer, providedBuffer)
        ) {
            throw new UnauthorizedException('Invalid API key');
        }

        return true;
    }
}