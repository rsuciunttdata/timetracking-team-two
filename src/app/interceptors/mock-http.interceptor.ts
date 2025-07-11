import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const mockHttpInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {

  if (!req.url.includes('/api/time-entries')) {
    return next(req);
  }

  const backendUrl = 'http://localhost:3001';

  const modifiedReq = req.clone({
    url: req.url.replace('/api/time-entries', `${backendUrl}/api/time-entries`),
    setHeaders: {
      'Content-Type': 'application/json'
    }
  });

  console.log(`[Interceptor] Intercepting ${req.method} ${req.url} → ${modifiedReq.url}`);

  return next(modifiedReq);
};
