import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOfferRequest, Offer, OfferStatus } from '../models/offer.model';

@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly http = inject(HttpClient);

  sendOffer(sellerId: string, request: CreateOfferRequest): Observable<Offer> {
    return this.http.post<Offer>(`/api/sellers/${sellerId}/offers`, request);
  }

  getInbox(): Observable<Offer[]> {
    return this.http.get<Offer[]>('/api/offers/inbox');
  }

  updateStatus(offerId: string, status: Extract<OfferStatus, 'accepted' | 'rejected'>): Observable<Offer> {
    return this.http.patch<Offer>(`/api/offers/${encodeURIComponent(offerId)}`, { status });
  }
}
