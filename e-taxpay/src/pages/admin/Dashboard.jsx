import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiUsers, FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import api from '../../lib/api'

export default function Dashboard() {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        totalTaxesCollected: 0,
        paidShops: 0,
        unpaidShops: 0,
        shopTypeData: [],
        recentPayments: [],
        blockData: [],
        collectionTrends: []
    })

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/admin/metrics');
                if (response.data.success) {
                    setMetrics(response.data.metrics);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard metrics");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard data...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.dashboard')}</h2>
                <p>Real-time overview of tax collection across the district</p>
            </div>

            {/* Stat Cards */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(66,133,244,0.1)', color: '#4285F4' }}>
                        <FiUsers size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{metrics.totalUsers}</h3>
                        <p>{t('admin.totalShops')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
                        <FiCheckCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{metrics.paidShops}</h3>
                        <p>{t('admin.paidShops')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-maroon-light)', color: 'var(--color-maroon)' }}>
                        <FiXCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{metrics.unpaidShops}</h3>
                        <p>{t('admin.unpaidShops')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(232,134,58,0.15)', color: 'var(--color-saffron)' }}>
                        <FiDollarSign size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>₹{metrics.totalTaxesCollected.toLocaleString()}</h3>
                        <p>{t('admin.totalCollected')}</p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid-2" style={{ marginBottom: 28 }}>
                <div className="chart-card">
                    <h4>{t('admin.blockWise')}</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={metrics.blockData || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: '1px solid #E5E0D5' }}
                                formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                            />
                            <Legend />
                            <Bar dataKey="paid" fill="#5B9A59" name="Paid" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="unpaid" fill="#821D30" name="Unpaid" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h4>{t('admin.shopTypeWise')}</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={metrics.shopTypeData || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, value }) => `${name} (${value}%)`}
                            >
                                {(metrics.shopTypeData || []).map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
                <div className="chart-card">
                    <h4>{t('admin.monthlyGrowth')}</h4>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={metrics.collectionTrends || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Collection']} />
                            <Line type="monotone" dataKey="collection" stroke="#821D30" strokeWidth={3} dot={{ fill: '#821D30', r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Payments */}
                <div className="chart-card">
                    <h4>{t('admin.recentPayments')}</h4>
                    <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(metrics.recentPayments || []).length > 0 ? (
                                    (metrics.recentPayments || []).map((p, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div>
                                                    <strong style={{ fontSize: '0.85rem' }}>{p.user}</strong>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.gst}</div>
                                                </div>
                                            </td>
                                            <td><strong style={{ color: 'var(--color-green)' }}>₹{p.amount}</strong></td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent payments</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
