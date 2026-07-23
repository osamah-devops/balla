export type ReportStatus = 'open' | 'dismissed';

export interface Report {
  id: string;
  conversationId: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reason: string;
  createdAt: string;
  status: ReportStatus;
}
