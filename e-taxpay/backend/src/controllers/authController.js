import { supabase } from '../config/supabase.js';

export const loginUser = async (req, res) => {
    try {
        const { gstId, password } = req.body;

        // Real Login: derive internal email from GST ID
        // Format: gst.GSTID@taxportal.gov.in (Supabase-safe format)
        const derivedEmail = `gst.${gstId.toLowerCase()}@taxportal.gov.in`;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: derivedEmail,
            password
        });

        if (error || !data.user) {
            return res.status(401).json({ success: false, error: 'Invalid GST ID or password.' });
        }

        // Fetch the full user profile from the users table
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();

        res.status(200).json({
            success: true,
            user: {
                id: data.user.id,
                gstId: profile?.gst_id || gstId,
                username: profile?.username || data.user.user_metadata?.username || 'User',
                role: 'user',
                block: profile?.block,
                district: profile?.district,
                mobile: profile?.mobile,
                businessType: profile?.business_type,
                token: data.session.access_token
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

export const loginAdmin = async (req, res) => {
    try {
        const { email, password, passkey } = req.body;

        if (!email || !password || !passkey) {
            return res.status(400).json({ success: false, error: 'Email, password, and passkey are required.' });
        }

        // Authenticate via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error || !data.user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        // Verify the user exists in the admins table and is active
        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*, roles(name)')
            .eq('auth_id', data.user.id)
            .eq('is_active', true)
            .single();

        if (adminError || !admin) {
            return res.status(403).json({ success: false, error: 'You are not authorized as an admin.' });
        }

        // Verify the passkey
        if (admin.passkey_hash !== passkey) {
            return res.status(401).json({ success: false, error: 'Invalid admin passkey.' });
        }

        // Determine the role name from the joined roles table
        const roleName = admin.roles?.name || 'district_admin';

        res.status(200).json({
            success: true,
            user: {
                id: data.user.id,
                adminId: admin.id,
                username: admin.username,
                email: admin.email,
                role: roleName,
                district: admin.district,
                token: data.session.access_token
            }
        });

    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

export const registerUser = async (req, res) => {
    try {
        const { username, gstId, mobile, password, district, block, businessType, fatherName } = req.body;

        // Basic validation
        if (!username || !gstId || !mobile || !password || !district || !block || !businessType) {
            return res.status(400).json({ success: false, error: 'All required fields must be filled.' });
        }

        // Same derived email formula as loginUser — must always match
        const derivedEmail = `gst.${gstId.toLowerCase()}@taxportal.gov.in`;

        const { data, error } = await supabase.auth.signUp({
            email: derivedEmail,
            password,
            options: {
                data: {
                    // This metadata is captured by the database trigger
                    // and used to fill the 'users' table automatically
                    username,
                    gst_id: gstId,
                    mobile,
                    district,
                    block,
                    business_type: businessType,
                    father_name: fatherName || '',
                    role: 'user'
                }
            }
        });

        if (error) {
            // Handle common Supabase errors with a clean message
            if (error.message.includes('already registered')) {
                return res.status(409).json({ success: false, error: 'An account with this GST ID already exists.' });
            }
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! You can now log in.',
            userId: data.user?.id
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    }
};
