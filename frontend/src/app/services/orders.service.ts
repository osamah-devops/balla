import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, UpdateOrderStatusRequest } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/mine');
  }

  getSellingOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/selling');
  }

  updateStatus(orderId: string, request: UpdateOrderStatusRequest): Observable<Order> {
    return this.http.patch<Order>(`/api/orders/${orderId}/status`, request);
  }
}
