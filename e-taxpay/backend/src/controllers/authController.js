import { supabase } from '../config/supabase.js';

export const loginUser = async (req, res) => {
  try {
    const { gstId, password, isDemo } = req.body;

    // For demo capability mapping to the frontend Demo alerts
    if (isDemo && gstId && password === 'demo123') {
        return res.status(200).json({
            success: true,
            user: {
                id: 'demo-user-id',
                gstId: gstId,
                role: 'user',
                token: 'demo-fake-jwt-token'
            }
        });
    }

    // In a real application, you'd lookup the email to use with Supabase based on the GST ID
    // E.g., const { data: profile } = await supabase.from('profiles').select('email').eq('gst_id', gstId).single();
    // For now, assuming direct email login for Supabase simplicity since GST itself isn't an email
    // This is a placeholder for actual Supabase auth integration
    
    // const { data, error } = await supabase.auth.signInWithPassword({ email: profile.email, password });

    return res.status(400).json({ success: false, error: 'Real login currently requires email binding to GST.' });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

export const loginAdmin = async (req, res) => {
    try {
      const { username, password, passkey, isDemo } = req.body;
      
      if (isDemo && password === 'admin123' && passkey === 'ADMIN2026') {
          return res.status(200).json({
              success: true,
              user: {
                  id: 'demo-admin-id',
                  username,
                  role: 'super_admin',
                  token: 'demo-fake-admin-jwt-token'
              }
          });
      }

      // Add actual Supabase Admin Server-side logic here later
      return res.status(400).json({ success: false, error: 'Not implemented for production.' });
  
    } catch (error) {
      console.error('Admin Login Error:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  };
