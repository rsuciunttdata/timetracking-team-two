import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const mockHttpInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {

  if (!req.url.includes('/api/time-entries')) {
    return next(req);
  }

  const backendUrl = 'http://localhost:3001';

  let modifiedUrl = req.url;
  if (req.url.includes('/api/time-entries/') && req.url.includes('/send-for-approval')) {
    modifiedUrl = req.url.replace('/api/time-entries', `${backendUrl}/api/time-entries`);
  } else {
    modifiedUrl = req.url.replace('/api/time-entries', `${backendUrl}/api/time-entries`);
  }

  const modifiedReq = req.clone({
    url: modifiedUrl,
    setHeaders: {
      'Content-Type': 'application/json'
    }
  });

  console.log(`[Interceptor] Intercepting ${req.method} ${req.url} → ${modifiedReq.url}`);

  return next(modifiedReq);
};
