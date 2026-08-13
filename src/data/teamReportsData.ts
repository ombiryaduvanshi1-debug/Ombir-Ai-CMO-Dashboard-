import { PresalesMemberReportItem, SalesManagerReportItem } from '../types';

export const mockPresalesMembersReportData: PresalesMemberReportItem[] = [
  {
    id: 'ps_1',
    name: 'Ananya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Senior Presales Specialist',
    totalLeadsHandled: 3420,
    totalLeadsPushed: 1850,
    unqualifiedLeads: 1120,
    siteVisitsScheduled: 1240,
    pushRatePct: 54.09,
    avgResponseTimeMin: 4.2,
    avgCallDurationSec: 185,
    status: 'Top Performer'
  },
  {
    id: 'ps_2',
    name: 'Rahul Verma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Presales Account Executive',
    totalLeadsHandled: 2980,
    totalLeadsPushed: 1420,
    unqualifiedLeads: 1180,
    siteVisitsScheduled: 950,
    pushRatePct: 47.65,
    avgResponseTimeMin: 6.5,
    avgCallDurationSec: 162,
    status: 'Active'
  },
  {
    id: 'ps_3',
    name: 'Priya Nambiar',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'Lead Nurturing Associate',
    totalLeadsHandled: 2750,
    totalLeadsPushed: 1390,
    unqualifiedLeads: 980,
    siteVisitsScheduled: 890,
    pushRatePct: 50.55,
    avgResponseTimeMin: 5.1,
    avgCallDurationSec: 174,
    status: 'Active'
  },
  {
    id: 'ps_4',
    name: 'Vikramaditya Roy',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'Enterprise Presales Lead',
    totalLeadsHandled: 3120,
    totalLeadsPushed: 1680,
    unqualifiedLeads: 1040,
    siteVisitsScheduled: 1120,
    pushRatePct: 53.85,
    avgResponseTimeMin: 3.8,
    avgCallDurationSec: 210,
    status: 'Top Performer'
  },
  {
    id: 'ps_5',
    name: 'Neha Kulkarni',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Digital Inbound Presales',
    totalLeadsHandled: 2580,
    totalLeadsPushed: 1180,
    unqualifiedLeads: 1090,
    siteVisitsScheduled: 780,
    pushRatePct: 45.74,
    avgResponseTimeMin: 8.2,
    avgCallDurationSec: 145,
    status: 'Active'
  }
];

export const mockSalesManagerReportData: SalesManagerReportItem[] = [
  {
    id: 'sm_1',
    name: 'Rajesh Iyer',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    regionOrTeam: 'North Region / Luxury Cluster',
    totalLeadsAssigned: 1850,
    totalSiteVisitsVisited: 1240,
    totalLeadsBooked: 460,
    totalRevenueINR: 115000000, // 11.5 Crores
    avgTicketSizeINR: 250000,
    visitToBookingRatePct: 37.10,
    overallLeadToBookingRatePct: 24.86,
    targetAchievementPct: 118.5
  },
  {
    id: 'sm_2',
    name: 'Sneha Gupta',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    regionOrTeam: 'West Region / Commercial Desk',
    totalLeadsAssigned: 1680,
    totalSiteVisitsVisited: 1120,
    totalLeadsBooked: 390,
    totalRevenueINR: 97500000, // 9.75 Crores
    avgTicketSizeINR: 250000,
    visitToBookingRatePct: 34.82,
    overallLeadToBookingRatePct: 23.21,
    targetAchievementPct: 105.2
  },
  {
    id: 'sm_3',
    name: 'Arjun Mehta',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    regionOrTeam: 'South Region / Tech Park Desk',
    totalLeadsAssigned: 1420,
    totalSiteVisitsVisited: 950,
    totalLeadsBooked: 320,
    totalRevenueINR: 80000000, // 8 Crores
    avgTicketSizeINR: 250000,
    visitToBookingRatePct: 33.68,
    overallLeadToBookingRatePct: 22.54,
    targetAchievementPct: 98.4
  },
  {
    id: 'sm_4',
    name: 'Kavita Reddy',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    regionOrTeam: 'East Region / Premium Residential',
    totalLeadsAssigned: 1390,
    totalSiteVisitsVisited: 890,
    totalLeadsBooked: 290,
    totalRevenueINR: 72500000, // 7.25 Crores
    avgTicketSizeINR: 250000,
    visitToBookingRatePct: 32.58,
    overallLeadToBookingRatePct: 20.86,
    targetAchievementPct: 94.1
  },
  {
    id: 'sm_5',
    name: 'Amitabh Choudhury',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    regionOrTeam: 'Central Region / NRI Desk',
    totalLeadsAssigned: 1180,
    totalSiteVisitsVisited: 780,
    totalLeadsBooked: 260,
    totalRevenueINR: 65000000, // 6.5 Crores
    avgTicketSizeINR: 250000,
    visitToBookingRatePct: 33.33,
    overallLeadToBookingRatePct: 22.03,
    targetAchievementPct: 101.8
  }
];
