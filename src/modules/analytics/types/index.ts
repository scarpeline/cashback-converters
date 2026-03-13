/**
 * Módulo Analytics — Tipos
 */

export interface AnalyticsDashboardData {
  revenue: RevenueMetrics;
  retention: RetentionMetrics;
  appointments: AppointmentMetrics;
  occupancy: OccupancyMetrics;
  period: AnalyticsPeriod;
}

export interface RevenueMetrics {
  total: number;
  average_ticket: number;
  growth_percentage: number;
  by_service: { service_name: string; total: number; count: number }[];
  by_professional: { professional_name: string; total: number; count: number }[];
  by_day: { date: string; total: number }[];
}

export interface RetentionMetrics {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  churn_rate: number;
  returning_rate: number;
  new_clients_month: number;
  average_visits_per_client: number;
}

export interface AppointmentMetrics {
  total: number;
  completed: number;
  cancelled: number;
  no_show: number;
  cancellation_rate: number;
  average_per_day: number;
  peak_hours: { hour: number; count: number }[];
}

export interface OccupancyMetrics {
  average_occupancy_rate: number;
  by_professional: { professional_name: string; rate: number }[];
  by_day_of_week: { day: string; rate: number }[];
  empty_slots_today: number;
  empty_slots_week: number;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '12m' | 'custom';

export interface AnalyticsFilter {
  barbershop_id: string;
  period: AnalyticsPeriod;
  start_date?: string;
  end_date?: string;
  professional_id?: string;
  service_id?: string;
}
