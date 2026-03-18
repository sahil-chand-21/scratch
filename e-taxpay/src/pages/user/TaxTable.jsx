import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FiDownload, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Papa from 'papaparse'
import api from '../../lib/api'

export default function TaxTable() {
    const { t } = useTranslation()
    const [yearFilter, setYearFilter] = useState('')
    const [taxData, setTaxData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUserTaxes = async () => {
            try {
                const response = await api.get('/taxes');
                if (response.data.success) {
                    // Map backend data to match expected frontend structure if needed
                    const mappedTaxes = response.data.taxes.map(t => ({
                        id: t.id,
                        year: t.year,
                        month: t.month,
                        amount: parseFloat(t.amount || 0),
                        penalty: parseFloat(t.penalty || 0),
                        total: parseFloat(t.amount || 0) + parseFloat(t.penalty || 0),
                        status: t.status,
                        paidDate: t.paid_date ? new Date(t.paid_date).toLocaleDateString('en-IN') : '-',
                        paidTime: t.paid_date ? new Date(t.paid_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
                        dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN') : '-'
                    }));
                    setTaxData(mappedTaxes);
                }
            } catch (error) {
                console.error("Failed to fetch tax history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserTaxes();
    }, []);

    const filtered = yearFilter ? taxData.filter(r => r.year === parseInt(yearFilter)) : taxData

    const totalPaid = filtered.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0)
    const totalPending = filtered.filter(r => r.status !== 'paid').reduce((s, r) => s + r.total, 0)

    const exportPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(16)
        doc.text('E-TaxPay - Tax Records', 14, 20)
        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28)

        doc.autoTable({
            startY: 35,
            head: [['Year', 'Month', 'Amount (₹)', 'Penalty (₹)', 'Total (₹)', 'Status', 'Paid Date']],
            body: filtered.map(r => [r.year, r.month, r.amount, r.penalty, r.total, r.status.toUpperCase(), r.paidDate]),
            theme: 'grid',
            headStyles: { fillColor: [130, 29, 48] },
            styles: { fontSize: 8 }
        })
        doc.save('tax-records.pdf')
    }

    const exportCSV = () => {
        const csv = Papa.unparse(filtered.map(r => ({
            Year: r.year, Month: r.month, Amount: r.amount, Penalty: r.penalty,
            Total: r.total, Status: r.status, PaidDate: r.paidDate
        })))
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'tax-records.csv'; a.click()
    }

    const statusIcon = (status) => {
        if (status === 'paid') return <FiCheckCircle color="var(--color-green)" />
        if (status === 'overdue') return <FiAlertTriangle color="var(--color-maroon)" />
        return <FiXCircle color="var(--color-saffron)" />
    }

    return (
        <div>
            <div className="page-header">
                <h2>{t('user.monthlyTax')}</h2>
                <p>{t('user.taxTable')} — View and export your complete tax history</p>
            </div>

            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
                        <FiCheckCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>₹{totalPaid.toLocaleString()}</h3>
                        <p>{t('user.totalPaid')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-maroon-light)', color: 'var(--color-maroon)' }}>
                        <FiXCircle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>₹{totalPending.toLocaleString()}</h3>
                        <p>{t('user.totalPending')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(232,134,58,0.15)', color: 'var(--color-saffron)' }}>
                        <FiAlertTriangle size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{filtered.filter(r => r.status === 'overdue').length}</h3>
                        <p>{t('user.overdue')}</p>
                    </div>
                </div>
            </div>

            {/* Filters + Export */}
            <div className="filter-bar">
                <select className="form-control" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                    <option value="">{t('user.year')} — All</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                </select>
                <div style={{ flex: 1 }}></div>
                <button className="btn btn-secondary btn-sm" onClick={exportPDF}>
                    <FiDownload size={14} /> {t('user.downloadPdf')}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
                    <FiDownload size={14} /> {t('user.downloadCsv')}
                </button>
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('user.year')}</th>
                            <th>{t('user.month')}</th>
                            <th>{t('user.amount')}</th>
                            <th>{t('user.penalty')}</th>
                            <th>Total</th>
                            <th>{t('user.status')}</th>
                            <th>{t('user.date')}</th>
                            <th>{t('user.time')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading tax history...</td></tr>
                        ) : filtered.length === 0 ? (
                             <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No tax records found.</td></tr>
                        ) : filtered.map(r => (
                            <tr key={r.id}>
                                <td>{r.year}</td>
                                <td>{r.month}</td>
                                <td>₹{r.amount}</td>
                                <td>{r.penalty > 0 ? <span style={{ color: 'var(--color-maroon)' }}>₹{r.penalty}</span> : '-'}</td>
                                <td><strong>₹{r.total}</strong></td>
                                <td>
                                    <span className={`badge badge-${r.status === 'paid' ? 'paid' : r.status === 'overdue' ? 'danger' : 'warning'}`}>
                                        {statusIcon(r.status)} {t(`user.${r.status}`) || r.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>{r.paidDate}</td>
                                <td>{r.paidTime}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
