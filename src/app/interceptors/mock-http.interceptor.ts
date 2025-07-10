// import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { of, switchMap, delay, catchError } from 'rxjs';

// export const mockHttpInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {

//   if (!req.url.includes('/api/time-entries')) {
//     return next(req);
//   }

//   const http = inject(HttpClient);

//   if (req.method === 'GET' && req.url.endsWith('/api/time-entries')) {

//     return http.get<{timeEntries: any[]}>('/time-entries.json').pipe(
//       switchMap(data => {
//         return of(new HttpResponse({
//           status: 200,
//           body: data.timeEntries
//         }));
//       }),
//       delay(500),
//       catchError(error => {
//         console.error('Error loading JSON:', error);
//         return of(new HttpResponse({
//           status: 200,
//           body: []
//         }));
//       })
//     );
//   }

//   if (req.method === 'POST' && req.url.endsWith('/api/time-entries')) {
//     const newEntry = {
//       id: Date.now(),
//       ...(req.body as any)
//     };

//     return of(new HttpResponse({
//       status: 201,
//       body: newEntry
//     })).pipe(delay(300));
//   }

//   if (req.method === 'PUT' && req.url.match(/\/api\/time-entries\/\d+$/)) {
//     return of(new HttpResponse({
//       status: 200,
//       body: { id: parseInt(req.url.split('/').pop() || '0'), ...(req.body as any) }
//     })).pipe(delay(300));
//   }

//   if (req.method === 'DELETE' && req.url.match(/\/api\/time-entries\/\d+$/)) {
//     return of(new HttpResponse({
//       status: 204,
//       body: null
//     })).pipe(delay(300));
//   }

//   return next(req);
// };

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

  console.log(`Intercepting ${req.method} ${req.url} → ${modifiedReq.url}`);

  return next(modifiedReq);
};
