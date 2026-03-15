import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../lib/api'

const actionColors = {
    'User Login': '#4285F4',
    'Admin Login': '#821D30',
    'Payment Made': '#5B9A59',
    'Notice Generated': '#E8863A',
    'Complaint Updated': '#D4712A',
    'User Registration': '#4285F4',
    'Gov Update Posted': '#5B9A59',
    'Auto Penalty': '#821D30',
    'Auto Tax Created': '#E8863A',
}

export default function AuditLogs() {
    const { t } = useTranslation()
    const [auditData, setAuditData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/admin/audit-logs')
                if (response.data.success) {
                    setAuditData(response.data.auditLogs)
                }
            } catch (error) {
                console.error('Failed to fetch audit logs')
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [])

    if (loading) return <div style={{ padding: '2rem' }}>Loading audit logs...</div>

    return (
        <div>
            <div className="page-header">
                <h2>{t('admin.auditLogs')}</h2>
                <p>Complete audit trail of all system actions</p>
            </div>

            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{t('admin.timestamp')}</th>
                            <th>{t('admin.action')}</th>
                            <th>{t('admin.performedBy')}</th>
                            <th>{t('admin.ipAddress')}</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditData.length > 0 ? auditData.map((log, index) => (
                            <tr key={log.id}>
                                <td>{index + 1}</td>
                                <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                                    {new Date(log.timestamp).toLocaleString('en-IN')}
                                </td>
                                <td>
                                    <span className="badge" style={{
                                        background: `${actionColors[log.action] || '#8A8A8A'}15`,
                                        color: actionColors[log.action] || '#8A8A8A'
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td><strong>{log.performedBy}</strong></td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.ip}</td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
