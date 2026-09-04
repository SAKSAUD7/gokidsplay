import { getDashboardStats } from "@/app/actions/admin";
import { getMarketingStats } from "@/app/actions/marketing";
import { getAdminSession, requirePermission } from "../../lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Users,
    CalendarCheck,
    DollarSign,
    FileSignature,
    TrendingUp,
    AlertCircle,
    Clock,
    CheckCircle,
    ArrowRight,
    PartyPopper,
    ShoppingBag,
    MessageSquare,
    HelpCircle,
    Image,
    Ticket,
    UserCheck,
    Repeat,
    Mail,
    MousePointerClick,
    UserPlus,
    UserMinus,
    CalendarHeart
} from "lucide-react";
import { PaymentOverviewWidget } from "./components/PaymentOverviewWidget";
import { RecentBookingsTable } from "./components/RecentBookingsTable";

export default async function AdminDashboard() {
    const session = await getAdminSession() as { email: string; role: string } | null;
    if (!session) {
        redirect("/admin/login");
    }

    try {
        await requirePermission('dashboard', 'read');
    } catch (e) {
        redirect("/admin/cms"); // Fallback for Content Managers
    }

    const stats = await getDashboardStats();
    const marketingStats = await getMarketingStats();

    // Calculate max revenue for chart scaling
    const maxRevenue = Math.max(...stats.monthlyRevenue.map((d: any) => d.total), 1000);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {session.email}</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings.toString()}
                    icon={<CalendarCheck className="text-blue-600" />}
                    trend="All Time"
                    trendUp={true}
                    color="blue"
                />
                <StatCard
                    title="Avg Booking Value"
                    value={`£${stats.avgBookingValue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<DollarSign className="text-emerald-600" />}
                    trend="Per Booking"
                    trendUp={true}
                    color="emerald"
                />
                <Link href="/admin/cms/contact-messages" className="block">
                    <StatCard
                        title="Unread Messages"
                        value={stats.unreadMessages.toString()}
                        icon={<MessageSquare className="text-purple-600" />}
                        trend={stats.latestMessagePreview || "No new messages"}
                        trendUp={stats.unreadMessages > 0}
                        color="purple"
                        alert={stats.unreadMessages > 5}
                    />
                </Link>
                <Link href="/admin/party-bookings" className="block">
                    <StatCard
                        title="Party Bookings"
                        value={stats.partyBookings.toString()}
                        icon={<PartyPopper className="text-amber-600" />}
                        trend="All Time"
                        trendUp={true}
                        color="amber"
                    />
                </Link>
                <Link href="/admin/events" className="block">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Special Events</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-2">{(stats.eventBookings ?? 0).toString()}</h3>
                            </div>
                            <div className="p-3 rounded-xl bg-rose-50 shadow-sm">
                                <CalendarHeart className="text-rose-600" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Event Bookings
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* New Revenue & Trends Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Today's Revenue"
                    value={`£${stats.todayRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<TrendingUp className="text-emerald-600" />}
                    trend={`${stats.bookingsToday} bookings today`}
                    trendUp={stats.todayRevenue >= stats.yesterdayRevenue}
                    color="emerald"
                />
                <StatCard
                    title="Booking Trend"
                    value={`${stats.bookingGrowth > 0 ? '+' : ''}${stats.bookingGrowth}%`}
                    icon={<Repeat className="text-indigo-600" />}
                    trend={`${stats.thisWeekBookings} this week vs ${stats.lastWeekBookings} last week`}
                    trendUp={stats.bookingGrowth > 0}
                    color="indigo"
                />
                <StatCard
                    title="Total Revenue"
                    value={`£${stats.totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<DollarSign className="text-teal-600" />}
                    trend="All Time"
                    trendUp={true}
                    color="teal"
                />
            </div>

            {/* Website Summary Section */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Website Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SummaryCard category="Bookings Breakdown" icon={<CalendarCheck size={16} />} items={[
                        { label: "Session Bookings", value: stats.sessionBookings },
                        { label: "Party Bookings", value: stats.partyBookings },
                        { label: "Event Bookings", value: stats.eventBookings ?? 0 },
                        { label: "Avg Booking Value", value: `£${stats.avgBookingValue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
                    ]} />
                    <SummaryCard category="Customer Insights" icon={<Users size={16} />} items={[
                        { label: "Total Customers", value: stats.totalCustomers },
                        { label: "New This Month", value: stats.newCustomersMonth },
                        { label: "Repeat Customers", value: stats.repeatCustomers }
                    ]} />
                    <SummaryCard category="Content Overview" icon={<Image size={16} />} items={[
                        { label: "Activities", value: stats.totalActivities },
                        { label: "FAQs", value: stats.totalFaqs },
                        { label: "Banners", value: stats.totalBanners }
                    ]} />
                    <SummaryCard category="System Health" icon={<Ticket size={16} />} items={[
                        { label: "Active Vouchers", value: stats.activeVouchers },
                        { label: "Redeemed Vouchers", value: stats.redeemedVouchers },
                        { label: "Party Bookings", value: stats.partyBookings }
                    ]} />
                </div>
            </div>

            {/* Email Marketing Performance Section */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">📧 Email Marketing Performance</h2>
                    <Link href="/admin/marketing" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                        View Campaigns <ArrowRight size={16} />
                    </Link>
                </div>

                {marketingStats.total_emails_sent === 0 && marketingStats.total_campaigns > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-blue-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Email Tracking Active</p>
                                <p className="text-xs text-blue-700 mt-1">Open and click tracking is now enabled.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-purple-100 rounded-lg"><Mail size={20} className="text-purple-600" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">Total Campaigns</p>
                                <h3 className="text-2xl font-bold text-slate-900">{marketingStats.total_campaigns}</h3>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600">{marketingStats.active_campaigns} active • {marketingStats.sent_campaigns} sent</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-emerald-100 rounded-lg"><Mail size={20} className="text-emerald-600" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">Open Rate</p>
                                <h3 className="text-2xl font-bold text-slate-900">{marketingStats.total_emails_sent > 0 ? `${marketingStats.avg_open_rate}%` : 'N/A'}</h3>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600">{marketingStats.total_emails_sent > 0 ? `${marketingStats.total_emails_sent} emails sent` : '0 emails sent'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-blue-100 rounded-lg"><MousePointerClick size={20} className="text-blue-600" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">Click Rate</p>
                                <h3 className="text-2xl font-bold text-slate-900">{marketingStats.total_emails_sent > 0 ? `${marketingStats.avg_click_rate}%` : 'N/A'}</h3>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600">{marketingStats.total_emails_sent > 0 ? 'Engagement tracking active' : 'Send campaigns to track engagement'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-indigo-100 rounded-lg"><UserPlus size={20} className="text-indigo-600" /></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">Subscribers</p>
                                <h3 className="text-2xl font-bold text-slate-900">{marketingStats.subscriber_count}</h3>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600">{marketingStats.unsubscribe_rate}% unsubscribe rate</p>
                    </div>
                </div>

                {marketingStats.recent_campaigns.length > 0 && (
                    <div className="bg-white rounded-xl border border-purple-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-900">Recent Campaigns</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Campaign</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Sent</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Recipients</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Open Rate</th>
                                        <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Click Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {marketingStats.recent_campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="hover:bg-purple-50/50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">{campaign.title}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{new Date(campaign.sent_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{campaign.sent_count}</td>
                                            <td className="px-4 py-3"><span className="text-sm font-bold text-emerald-600">{campaign.open_rate.toFixed(1)}%</span></td>
                                            <td className="px-4 py-3"><span className="text-sm font-bold text-blue-600">{campaign.click_rate.toFixed(1)}%</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Overview Section */}
            <div className="mb-8">
                <PaymentOverviewWidget />
            </div>

            <div className="grid grid-cols-1 gap-8 mb-8">
                {/* System Status - Full Width */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-slate-400" />
                        System Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-start gap-3 shadow-sm">
                            <div className="p-2.5 bg-emerald-100 rounded-lg shrink-0 shadow-sm">
                                <CheckCircle size={18} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-emerald-900">System Active</p>
                                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">All systems operational.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-3 shadow-sm">
                            <div className="p-2.5 bg-blue-100 rounded-lg shrink-0 shadow-sm">
                                <CalendarCheck size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-900">{stats.bookingsToday} Bookings Today</p>
                                <p className="text-xs text-blue-700 mt-1 leading-relaxed">Check staff availability for peak hours.</p>
                            </div>
                        </div>

                        {stats.unreadMessages > 0 && (
                            <Link href="/admin/cms/contact-messages">
                                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="p-2.5 bg-purple-100 rounded-lg shrink-0 shadow-sm">
                                        <MessageSquare size={18} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-purple-900">{stats.unreadMessages} Unread Messages</p>
                                        <p className="text-xs text-purple-700 mt-1 leading-relaxed">Customer inquiries need response.</p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Bookings Table - client component (supports popup modal) */}
            <RecentBookingsTable bookings={stats.recentBookings} />
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp, color, alert }: { title: string; value: string; icon: React.ReactNode; trend: string; trendUp: boolean; color: string; alert?: boolean }) {
    return (
        <div className={`bg-white rounded-xl p-6 shadow-md border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${alert ? 'border-amber-200 ring-2 ring-amber-100' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-${color}-50 shadow-sm`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-300",
        PENDING: "bg-amber-100 text-amber-700 border-amber-300",
        CANCELLED: "bg-red-100 text-red-700 border-red-300",
        COMPLETED: "bg-blue-100 text-blue-700 border-blue-300",
    };

    const defaultStyle = "bg-slate-100 text-slate-700 border-slate-300";

    return (
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${styles[status] || defaultStyle} inline-flex items-center gap-1.5`}>
            <span className={`w-2 h-2 rounded-full ${status === 'CONFIRMED' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            {status}
        </span>
    );
}

function SummaryCard({ category, icon, items }: {
    category: string;
    icon: React.ReactNode;
    items: { label: string; value: string | number }[]
}) {
    return (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-slate-500">
                {icon}
                <h3 className="text-xs font-bold uppercase tracking-wider">
                    {category}
                </h3>
            </div>
            <div className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
