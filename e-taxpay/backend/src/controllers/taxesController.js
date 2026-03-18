import { supabase } from '../config/supabase.js';

// Helper: resolve the public.users.id from a Supabase Auth UID
// taxes.user_id references public.users.id, not auth.users.id
async function getPublicUserId(authId) {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authId)
        .single();

    if (error || !data) {
        throw new Error('User profile not found. Make sure the users table has a row for this auth user.');
    }
    return data.id;
}

// Get Taxes for the logged-in user
export const getUserTaxes = async (req, res) => {
    try {
        const publicUserId = await getPublicUserId(req.user.id);

        const { data: taxes, error } = await supabase
            .from('taxes')
            .select('*')
            .eq('user_id', publicUserId)
            .order('year', { ascending: false })
            .order('month', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, taxes });
    } catch (error) {
        console.error('getUserTaxes error:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch taxes' });
    }
};

// Create a new Tax record for the user
export const fileUserTax = async (req, res) => {
    try {
        const publicUserId = await getPublicUserId(req.user.id);
        const { year, month, amount, due_date } = req.body;

        if (!year || !month || !amount || !due_date) {
            return res.status(400).json({ success: false, error: 'Missing required tax fields' });
        }

        const { data: tax, error } = await supabase
            .from('taxes')
            .insert([{ user_id: publicUserId, year, month, amount, status: 'pending', due_date }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ success: false, error: 'Tax record already exists for this period.' });
            }
            throw error;
        }

        res.status(201).json({ success: true, message: 'Tax filed successfully', tax });
    } catch (error) {
        console.error('fileUserTax error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to file tax' });
    }
};

// Mark a tax as paid
export const payUserTax = async (req, res) => {
    try {
        const publicUserId = await getPublicUserId(req.user.id);
        const { taxId } = req.params;

        const { data: tax, error } = await supabase
            .from('taxes')
            .update({ status: 'paid', paid_date: new Date().toISOString() })
            .eq('id', taxId)
            .eq('user_id', publicUserId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Tax marked as paid', tax });
    } catch (error) {
        console.error('payUserTax error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to process tax payment' });
    }
};
