import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentAcademicSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers || {};
    const query = request.query || {};
    const body = request.body || {};

    const sessionId =
      headers['x-academic-session-id'] ||
      headers['x-academic-session'] ||
      headers['x-academic-year-id'] ||
      query.academicSessionId ||
      body.academicSessionId;

    if (sessionId && sessionId !== 'null' && sessionId !== 'undefined') {
      return String(sessionId);
    }
    return null;
  },
);
