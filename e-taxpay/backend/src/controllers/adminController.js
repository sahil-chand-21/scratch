import { supabase } from '../config/supabase.js';

export const getAllUsers = async (req, res) => {
  try {
    // In a real scenario you might need to use the Supabase Admin API
    // or query a custom `profiles` public table that maps to auth.users
    const { data: users, error } = await supabase
      .from('profiles') // Assuming a public profiles table exists
      .select('*');

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

export const getMetrics = async (req, res) => {
  try {
    // Fetch total active users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user');

    // Fetch taxes joined with profile data (for block aggregation) we don't need inner join just normal foreign key
    const { data: taxesData, error: taxesError } = await supabase
      .from('taxes')
      .select('amount, status, month, year, profiles(block)');

    if (taxesError) throw taxesError;

    let totalTaxesCollected = 0;
    const blockMap = {};
    const trendMap = {};

    taxesData.forEach(tax => {
        // Only count paid taxes for the total
        if (tax.status === 'paid') {
            totalTaxesCollected += parseFloat(tax.amount || 0);
        }

        // Aggregate by block
        const block = (tax.profiles && tax.profiles.block) ? tax.profiles.block : 'Unknown';
        if (!blockMap[block]) {
            blockMap[block] = { name: block, paid: 0, unpaid: 0 };
        }
        if (tax.status === 'paid') {
            blockMap[block].paid += parseFloat(tax.amount || 0);
        } else {
            blockMap[block].unpaid += parseFloat(tax.amount || 0);
        }

        // Aggregate by month/year trend (e.g. "Jan 2026")
        if (tax.status === 'paid') {
            const periodStr = `${tax.month.substring(0,3)} ${tax.year}`;
            if (!trendMap[periodStr]) {
                trendMap[periodStr] = { name: periodStr, collection: 0, target: 0 };
            }
            trendMap[periodStr].collection += parseFloat(tax.amount || 0);
        }
    });

    // Create sorted mock targets for trends just so the chart looks complete if missing data
    const collectionTrends = Object.values(trendMap).map(item => ({
        ...item,
        target: item.collection + 500 // arbitrary target visually
    }));

    const blockData = Object.values(blockMap);

    const metrics = {
      totalUsers: totalUsers || 0,
      totalTaxesCollected: totalTaxesCollected || 0,
      activeSessions: 12, // Still mock for now as sessions aren't tracked historically
      blockData,
      collectionTrends
    };

    res.status(200).json({ success: true, metrics });
  } catch (error) {
    console.error('getMetrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
};
