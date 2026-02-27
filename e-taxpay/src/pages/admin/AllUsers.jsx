import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSearch, FiDownload, FiEye } from 'react-icons/fi'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const allUsers = [
    { id: 1, name: 'Rajesh Kumar', gst: '05AAAPZ2694Q1ZN', block: 'Almora', type: 'General Store', mobile: '9876543210', status: 'paid', month: 'Feb', year: 2026, date: '25 Feb 2026', time: '14:30' },
    { id: 2, name: 'Priya Devi', gst: '05BBBPZ3584Q2YM', block: 'Hawalbagh', type: 'Medical', mobile: '9876543211', status: 'paid', month: 'Feb', year: 2026, date: '26 Feb 2026', time: '10:15' },
    { id: 3, name: 'Mohan Lal', gst: '05CCCPZ4474Q3XN', block: 'Salt', type: 'Clothing', mobile: '9876543212', status: 'unpaid', month: 'Feb', year: 2026, date: '-', time: '-' },
    { id: 4, name: 'Kamla Bisht', gst: '05DDDPZ5364Q4WO', block: 'Dwarahat', type: 'Electronics', mobile: '9876543213', status: 'paid', month: 'Jan', year: 2026, date: '20 Jan 2026', time: '16:45' },
    { id: 5, name: 'Suresh Rawat', gst: '05EEEPZ6254Q5VP', block: 'Almora', type: 'Restaurant', mobile: '9876543214', status: 'unpaid', month: 'Feb', year: 2026, date: '-', time: '-' },
    { id: 6, name: 'Anita Pant', gst: '05FFFPZ7144Q6UQ', block: 'Lamgara', type: 'General Store', mobile: '9876543215', status: 'paid', month: 'Feb', year: 2026, date: '22 Feb 2026', time: '09:30' },
    { id: 7, name: 'Dinesh Joshi', gst: '05GGGPZ8034Q7TR', block: 'Bhaisiyachana', type: 'Hardware', mobile: '9876543216', status: 'unpaid', month: 'Jan', year: 2026, date: '-', time: '-' },
    { id: 8, name: 'Geeta Sharma', gst: '05HHHPZ9924Q8SS', block: 'Hawalbagh', type: 'Stationery', mobile: '9876543217', status: 'paid', month: 'Feb', year: 2026, date: '24 Feb 2026', time: '11:00' },
    { id: 9, name: 'Harish Pandey', gst: '05IIIPZ0814Q9RT', block: 'Salt', type: 'General Store', mobile: '9876543218', status: 'paid', month: 'Feb', year: 2026, date: '23 Feb 2026', time: '13:20' },
    { id: 10, name: 'Kiran Negi', gst: '05JJJPZ1704Q0QU', block: 'Almora', type: 'Medical', mobile: '9876543219', status: 'unpaid', month: 'Feb', year: 2026, date: '-', time: '-' },
]

export default function AllUsers() {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [blockFilter, setBlockFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    const filtered = allUsers.filter(u => {
        if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.gst.toLowerCase().includes(search.toLowerCase())) return false
        if (blockFilter && u.block !== blockFilter) return false
        if (statusFilter && u.status !== statusFilter) return false
        if (typeFilter && u.type !== typeFilter) return false
        return true
    })

    const blocks = [...new Set(allUsers.map(u => u.block))]
    const types = [...new Set(allUsers.map(u => u.type))]

    const exportPDF = () => {
        const doc = new jsPDF('landscape')
        doc.setFontSize(14)
        doc.text('E-TaxPay — All Registered Users', 14, 15)
        doc.autoTable({
            startY: 22,
            head: [['S.No', 'Name', 'GST ID', 'Block', 'Type', 'Month', 'Year', 'Status', 'Date', 'Time']],
            body: filtered.map((u, i) => [i + 1, u.name, u.gst, u.block, u.type, u.month, u.year, u.status.toUpperCase(), u.date, u.time]),
            theme: 'grid',
            headStyles: { fillColor: [130, 29, 48] },
            styles: { fontSize: 7 }
        })
        doc.save('all-users.pdf')
    }

    return (
        <div>
            <div className="page-header-actions">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>{t('admin.allUsers')}</h2>
                    <p>Complete data of all registered shops</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={exportPDF}>
                        <FiDownload size={14} /> {t('admin.exportPdf')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                    <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-control" style={{ paddingLeft: 36 }}
                        placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-control" value={blockFilter} onChange={e => setBlockFilter(e.target.value)}>
                    <option value="">All Blocks</option>
                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="paid">{t('user.paid')}</option>
                    <option value="unpaid">{t('user.unpaid')}</option>
                </select>
                <select className="form-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    {types.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setBlockFilter(''); setStatusFilter(''); setTypeFilter('') }}>
                    {t('admin.reset')}
                </button>
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('common.serialNo')}</th>
                            <th>Name</th>
                            <th>GST ID</th>
                            <th>Block</th>
                            <th>Type</th>
                            <th>{t('user.month')}</th>
                            <th>{t('user.status')}</th>
                            <th>{t('user.date')}</th>
                            <th>{t('user.time')}</th>
                            <th>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((u, i) => (
                            <tr key={u.id}>
                                <td>{i + 1}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="profile-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                            {u.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <strong>{u.name}</strong>
                                    </div>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u.gst}</td>
                                <td>{u.block}</td>
                                <td><span className="badge badge-info">{u.type}</span></td>
                                <td>{u.month} {u.year}</td>
                                <td>
                                    <span className={`badge badge-${u.status === 'paid' ? 'paid' : 'danger'}`}>
                                        {u.status === 'paid' ? '✓' : '✗'} {t(`user.${u.status}`)}
                                    </span>
                                </td>
                                <td>{u.date}</td>
                                <td>{u.time}</td>
                                <td>
                                    <button className="btn btn-secondary btn-sm">
                                        <FiEye size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing {filtered.length} of {allUsers.length} users
            </div>
        </div>
    )
}
