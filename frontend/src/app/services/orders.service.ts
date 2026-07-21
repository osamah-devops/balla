import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private orders$?: Observable<Order[]>;

  getOrders(): Observable<Order[]> {
    this.orders$ ??= this.http.get<Order[]>('/data/orders.json').pipe(shareReplay(1));
    return this.orders$;
  }

  getOrdersBySeller(sellerId: string): Observable<Order[]> {
    return this.getOrders().pipe(map((orders) => orders.filter((order) => order.sellerId === sellerId)));
  }
}