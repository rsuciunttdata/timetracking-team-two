import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  uid: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  private credentialsUrl = 'assets/credentials.json';


  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.credentialsUrl);
  }
}
