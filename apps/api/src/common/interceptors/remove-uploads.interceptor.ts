import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { rm } from 'node:fs/promises';
import { finalize, type Observable } from 'rxjs';

const uploadsOf = ({ file, files }: Request): Express.Multer.File[] => {
  const all = Array.isArray(files) ? files : Object.values(files ?? {}).flat();
  return file ? [file, ...all] : all;
};

/** Removes the multer disk uploads of the request once it ends, after a success or an error */
@Injectable()
export class RemoveUploadsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      finalize(() => {
        const paths = uploadsOf(request).flatMap(({ path }) => (path ? [path] : []));
        void Promise.all(paths.map((path) => rm(path, { force: true }))).catch(() => undefined);
      }),
    );
  }
}
