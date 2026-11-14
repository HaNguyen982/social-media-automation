
import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      success: true,
      message: 'Social Media Content API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
