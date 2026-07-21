import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CheckoutRequest, CheckoutSessionResponse } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);

  createSession(request: CheckoutRequest): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>('/api/checkout/session', request);
  }
}
