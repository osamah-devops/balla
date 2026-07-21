import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

const API_PREFIX = '/api';

interface ProblemDetailsBody {
  title?: string;
  errors?: Record<string, string[]>;
}

interface BallaErrorBody {
  message?: string;
}

/** Surfaces backend error messages as toasts; the error still propagates so components can handle it too. */
export const errorToastInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX)) {
    return next(req);
  }

  const toastr = inject(ToastrService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        toastr.error(extractMessage(error));
      }
      return throwError(() => error);
    }),
  );
};

function extractMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Could not reach the server. Check your connection and try again.';
  }

  const body = error.error as BallaErrorBody & ProblemDetailsBody | null;
  if (body?.message) {
    return body.message;
  }
  if (body?.errors) {
    const firstError = Object.values(body.errors)[0]?.[0];
    if (firstError) {
      return firstError;
    }
  }
  if (body?.title) {
    return body.title;
  }
  return 'Something went wrong. Please try again.';
}
