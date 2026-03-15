import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiPlusCircle, FiTrash2, FiCheckCircle } from 'react-icons/fi'
import api from '../../lib/api'

export default function GovUpdatesAdmin() {
    const { t } = useTranslation()
    const [updates, setUpdates] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', content: '', category: 'notice' })
    const [published, setPublished] = useState(false)

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const response = await api.get('/admin/gov-updates')
                if (response.data.success) {
                    setUpdates(response.data.updates)
                }
            } catch (error) {
                console.error('Failed to fetch government updates')
            } finally {
                setLoading(false)
            }
        }
        fetchUpdates()
    }, [])

    const handlePublish = async (e) => {
        e.preventDefault()
        try {
            const response = await api.post('/admin/gov-updates', {
                title: form.title,
                content: form.content,
                category: form.category
            })
            if (response.data.success) {
                const newUpdate = {
                    id: response.data.update.id,
                    title: form.title,
                    content: form.content,
                    category: form.category,
                    date: new Date().toISOString().split('T')[0]
                }
                setUpdates([newUpdate, ...updates])
                setForm({ title: '', content: '', category: 'notice' })
                setShowForm(false)
                setPublished(true)
                setTimeout(() => setPublished(false), 3000)
            }
        } catch (error) {
            console.error('Failed to publish update')
        }
    }

    const deleteUpdate = async (id) => {
        try {
            const response = await api.delete(`/admin/gov-updates/${id}`)
            if (response.data.success) {
                setUpdates(updates.filter(u => u.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete update')
        }
    }

    if (loading) return <div style={{ padding: '2rem' }}>Loading government updates...</div>

    return (
        <div>
            <div className="page-header-actions">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>{t('admin.govUpdates')}</h2>
                    <p>Manage government updates and notifications</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <FiPlusCircle size={16} /> {t('admin.postUpdate')}
                </button>
            </div>

            {published && (
                <div className="alert alert-success">
                    <FiCheckCircle /> Update published successfully!
                </div>
            )}

            {showForm && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <h4 style={{ marginBottom: 16 }}>New Government Update</h4>
                    <form onSubmit={handlePublish}>
                        <div className="form-group">
                            <label>{t('admin.updateTitle')}</label>
                            <input type="text" className="form-control" required value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Enter update title" />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select className="form-control" value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}>
                                <option value="tax_update">Tax Update</option>
                                <option value="scheme">Scheme</option>
                                <option value="notice">Notice</option>
                                <option value="announcement">Announcement</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t('admin.updateContent')}</label>
                            <textarea className="form-control" required value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                placeholder="Enter update content" rows={4}></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" className="btn btn-green">{t('admin.publish')}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
                {updates.length > 0 ? updates.map(update => (
                    <div key={update.id} className="update-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span className="badge badge-info">{update.category}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {new Date(update.date).toLocaleDateString('en-IN')}
                                </span>
                            </div>
                            <h4>{update.title}</h4>
                            <p>{update.content}</p>
                        </div>
                        <button className="btn btn-icon btn-secondary" onClick={() => deleteUpdate(update.id)}
                            style={{ flexShrink: 0, marginLeft: 12 }}>
                            <FiTrash2 size={14} color="var(--color-maroon)" />
                        </button>
                    </div>
                )) : (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No government updates found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
