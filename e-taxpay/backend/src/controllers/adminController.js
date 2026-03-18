import { supabase } from '../config/supabase.js';

// ============================================
// USERS
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// ============================================
// DASHBOARD METRICS
// ============================================
export const getMetrics = async (req, res) => {
  try {
    // Fetch total active users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Fetch all taxes with user data for aggregation
    const { data: taxesData, error: taxesError } = await supabase
      .from('taxes')
      .select('amount, status, month, year, user_id, paid_date, users(block, username, gst_id, business_type)');

    if (taxesError) throw taxesError;

    let totalTaxesCollected = 0;
    const blockMap = {};
    const trendMap = {};
    const paidUserIds = new Set();
    const allUserIds = new Set();
    const shopTypeMap = {};
    const recentPaid = [];

    taxesData.forEach(tax => {
      allUserIds.add(tax.user_id);

      if (tax.status === 'paid') {
        totalTaxesCollected += parseFloat(tax.amount || 0);
        paidUserIds.add(tax.user_id);
        recentPaid.push(tax);
      }

      // Aggregate by block
      const block = (tax.users && tax.users.block) ? tax.users.block : 'Unknown';
      if (!blockMap[block]) {
        blockMap[block] = { name: block, paid: 0, unpaid: 0 };
      }
      if (tax.status === 'paid') {
        blockMap[block].paid += parseFloat(tax.amount || 0);
      } else {
        blockMap[block].unpaid += parseFloat(tax.amount || 0);
      }

      // Aggregate by month/year trend
      if (tax.status === 'paid') {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthName = months[tax.month - 1] || 'Unknown';
        const periodStr = `${monthName} ${tax.year}`;
        if (!trendMap[periodStr]) {
          trendMap[periodStr] = { name: periodStr, collection: 0 };
        }
        trendMap[periodStr].collection += parseFloat(tax.amount || 0);
      }

      // Aggregate by shop/business type
      const bizType = (tax.users && tax.users.business_type) ? tax.users.business_type : 'Other';
      if (!shopTypeMap[bizType]) {
        shopTypeMap[bizType] = 0;
      }
      shopTypeMap[bizType]++;
    });

    // Build shopTypeData for the pie chart
    const typeColors = ['#E8863A', '#5B9A59', '#821D30', '#4285F4', '#D4712A', '#8A8A8A', '#6C5B7B', '#355C7D'];
    const totalEntries = taxesData.length || 1;
    const shopTypeData = Object.entries(shopTypeMap).map(([name, count], i) => ({
      name,
      value: Math.round((count / totalEntries) * 100),
      color: typeColors[i % typeColors.length]
    }));

    // Recent payments (last 5 paid, sorted by paid_date desc)
    recentPaid.sort((a, b) => new Date(b.paid_date || 0) - new Date(a.paid_date || 0));
    const recentPayments = recentPaid.slice(0, 5).map(tax => ({
      user: tax.users?.username || 'Unknown',
      gst: tax.users?.gst_id || '',
      amount: parseFloat(tax.amount),
      date: tax.paid_date ? new Date(tax.paid_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      status: 'paid'
    }));

    const collectionTrends = Object.values(trendMap);
    const blockData = Object.values(blockMap);
    const paidShops = paidUserIds.size;
    const unpaidShops = Math.max(0, (totalUsers || 0) - paidShops);

    // ---- Analytics data for TaxAnalytics page ----
    // Yearly aggregation
    const yearMap = {};
    const monthlyMap = {};
    const blockAnalyticsMap = {};
    const shopTypeAnalyticsMap = {};

    taxesData.forEach(tax => {
      const amount = parseFloat(tax.amount || 0);
      const year = tax.year;
      const month = tax.month;

      // Yearly totals (paid only)
      if (tax.status === 'paid') {
        if (!yearMap[year]) yearMap[year] = 0;
        yearMap[year] += amount;
      }

      // Monthly breakdown by year
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthName = months[month - 1] || 'Unknown';
      if (!monthlyMap[monthName]) monthlyMap[monthName] = { month: monthName };
      const yearKey = String(year);
      if (!monthlyMap[monthName][yearKey]) monthlyMap[monthName][yearKey] = 0;
      if (tax.status === 'paid') {
        monthlyMap[monthName][yearKey] += amount;
      }

      // Block analytics
      const block = (tax.users && tax.users.block) ? tax.users.block : 'Unknown';
      if (!blockAnalyticsMap[block]) {
        blockAnalyticsMap[block] = { block, total: 0, paid: 0, pending: 0 };
      }
      blockAnalyticsMap[block].total += amount;
      if (tax.status === 'paid') {
        blockAnalyticsMap[block].paid += amount;
      } else {
        blockAnalyticsMap[block].pending += amount;
      }

      // Shop type analytics
      const bizType = (tax.users && tax.users.business_type) ? tax.users.business_type : 'Other';
      if (!shopTypeAnalyticsMap[bizType]) {
        shopTypeAnalyticsMap[bizType] = { type: bizType, shops: new Set(), collected: 0, pending: 0 };
      }
      shopTypeAnalyticsMap[bizType].shops.add(tax.user_id);
      if (tax.status === 'paid') {
        shopTypeAnalyticsMap[bizType].collected += amount;
      } else {
        shopTypeAnalyticsMap[bizType].pending += amount;
      }
    });

    const yearlyData = Object.entries(yearMap)
      .map(([year, amount]) => ({ year, amount }))
      .sort((a, b) => a.year - b.year);

    const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyBreakdown = monthOrder
      .filter(m => monthlyMap[m])
      .map(m => monthlyMap[m]);

    const blockAnalytics = Object.values(blockAnalyticsMap);
    const shopTypeAnalytics = Object.values(shopTypeAnalyticsMap).map(item => ({
      type: item.type,
      shops: item.shops.size,
      collected: item.collected,
      pending: item.pending
    }));

    const metrics = {
      totalUsers: totalUsers || 0,
      totalTaxesCollected,
      paidShops,
      unpaidShops,
      blockData,
      collectionTrends,
      shopTypeData,
      recentPayments,
      // Analytics data
      yearlyData,
      monthlyBreakdown,
      blockAnalytics,
      shopTypeAnalytics
    };

    res.status(200).json({ success: true, metrics });
  } catch (error) {
    console.error('getMetrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
};

// ============================================
// COMPLAINTS
// ============================================
export const getComplaints = async (req, res) => {
  try {
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*, users(username, gst_id)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = complaints.map(c => ({
      id: c.id,
      user: c.users?.username || 'Unknown',
      shop: c.shop_name,
      location: c.location,
      reason: c.reason,
      description: c.description,
      date: new Date(c.created_at).toISOString().split('T')[0],
      status: c.status,
      photo: c.photo_url,
      admin_notes: c.admin_notes
    }));

    res.status(200).json({ success: true, complaints: formatted });
  } catch (error) {
    console.error('getComplaints error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
  }
};

export const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, complaint: data });
  } catch (error) {
    console.error('updateComplaint error:', error);
    res.status(500).json({ success: false, error: 'Failed to update complaint' });
  }
};

// ============================================
// NOTICES
// ============================================
export const getNotices = async (req, res) => {
  try {
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*, users(username, gst_id)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, notices });
  } catch (error) {
    console.error('getNotices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notices' });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { user_id, title, message, notice_month, notice_year, is_urgent } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({ success: false, error: 'user_id, title, and message are required.' });
    }

    const adminId = req.admin?.id || null;

    const { data, error } = await supabase
      .from('notices')
      .insert([{
        user_id,
        admin_id: adminId,
        title,
        message,
        notice_month: notice_month || null,
        notice_year: notice_year || null,
        is_urgent: is_urgent || false
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, notice: data });
  } catch (error) {
    console.error('createNotice error:', error);
    res.status(500).json({ success: false, error: 'Failed to create notice' });
  }
};

// ============================================
// AUDIT LOGS
// ============================================
export const getAuditLogs = async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const formatted = logs.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      action: log.action,
      performedBy: log.details?.performed_by || 'System',
      ip: log.ip_address || 'N/A',
      details: log.details?.description || JSON.stringify(log.details || {})
    }));

    res.status(200).json({ success: true, auditLogs: formatted });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
};

// ============================================
// GOVERNMENT UPDATES
// ============================================
export const getGovUpdates = async (req, res) => {
  try {
    const { data: updates, error } = await supabase
      .from('government_updates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = updates.map(u => ({
      id: u.id,
      title: u.title,
      content: u.content,
      date: new Date(u.created_at).toISOString().split('T')[0],
      category: u.category
    }));

    res.status(200).json({ success: true, updates: formatted });
  } catch (error) {
    console.error('getGovUpdates error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch government updates' });
  }
};

export const createGovUpdate = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required.' });
    }

    const adminId = req.admin?.id || null;

    const { data, error } = await supabase
      .from('government_updates')
      .insert([{
        admin_id: adminId,
        title,
        content,
        category: category || 'notice'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, update: data });
  } catch (error) {
    console.error('createGovUpdate error:', error);
    res.status(500).json({ success: false, error: 'Failed to create government update' });
  }
};

export const deleteGovUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('government_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Update deleted successfully' });
  } catch (error) {
    console.error('deleteGovUpdate error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete government update' });
  }
};
