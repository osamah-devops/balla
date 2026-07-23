import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';
import { Owner } from '../models/owner.model';
import { Product } from '../models/product.model';
import { Report, ReportStatus } from '../models/report.model';
import { User, UserStatus } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  listUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/admin/users');
  }

  updateUserStatus(userId: string, status: UserStatus): Observable<User> {
    return this.http.patch<User>(`/api/admin/users/${userId}/status`, { status });
  }

  listProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/admin/products');
  }

  updateProductVisibility(productId: string, hidden: boolean): Observable<Product> {
    return this.http.patch<Product>(`/api/admin/products/${productId}/visibility`, { hidden });
  }

  updateOwnerVerification(ownerId: string, verified: boolean): Observable<Owner> {
    return this.http.patch<Owner>(`/api/admin/owners/${ownerId}/verification`, { verified });
  }

  listOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/admin/orders');
  }

  listReports(): Observable<Report[]> {
    return this.http.get<Report[]>('/api/admin/reports');
  }

  updateReportStatus(reportId: string, status: ReportStatus): Observable<Report> {
    return this.http.patch<Report>(`/api/admin/reports/${encodeURIComponent(reportId)}/status`, { status });
  }
}
