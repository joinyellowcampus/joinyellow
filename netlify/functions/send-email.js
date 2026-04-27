const https = require('https');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { email, code, firstName } = body;

  if (!email) {
    return { statusCode: 400, body: 'Missing email' };
  }

  // Verification code email
  const isVerification = !!code;

  const emailHtml = isVerification ? `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#000;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 28px 0;">
          <span style="font-family:Georgia,serif;font-size:20px;font-weight:bold;font-style:italic;color:#EDD87A;">yellow</span>
        </td></tr>
        <tr><td style="background:#0d0d0d;padding:44px 40px;border:1px solid #222;">
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.75;color:#F0EDD8;">hey,</p>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.75;color:#ccc;">your verification code for yellow is:</p>
          <div style="background:#141414;border:1px solid #333;padding:24px;text-align:center;margin:0 0 24px 0;">
            <span style="font-family:Georgia,serif;font-size:48px;font-weight:bold;color:#EDD87A;letter-spacing:0.3em;">${code}</span>
          </div>
          <p style="margin:0 0 20px 0;font-size:13px;line-height:1.75;color:#666;">this code expires in 10 minutes. if you didn't request this, ignore this email.</p>
        </td></tr>
        <tr><td style="padding:20px 0 0 0;">
          <p style="margin:0;font-size:11px;color:#444;">yellow · joinyellow.net · built by an SBU student</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>` : `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#000;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 28px 0;">
          <span style="font-family:Georgia,serif;font-size:20px;font-weight:bold;font-style:italic;color:#EDD87A;">yellow</span>
        </td></tr>
        <tr><td style="background:#0d0d0d;padding:44px 40px;border:1px solid #222;">
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.75;color:#F0EDD8;">hey ${firstName || ''},</p>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.75;color:#ccc;">you're in. yellow is almost live at SBU.</p>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.75;color:#ccc;">browse and explore SBU students. when you find someone you want to connect with, you can unlock messaging.</p>
          <p style="margin:0 0 32px 0;font-size:15px;line-height:1.75;color:#ccc;">free to join · upgrade when you're ready</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
            <tr><td style="background:#EDD87A;padding:13px 28px;">
              <a href="https://joinyellow.net" style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#000;text-decoration:none;">visit yellow →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 0 0 0;">
          <p style="margin:0;font-size:11px;color:#444;">yellow · joinyellow.net · built by an SBU student</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = isVerification ? 'your yellow verification code' : 'your college experience, connected';

  const payload = JSON.stringify({
    from: 'yellow <hello@joinyellow.net>',
    to: [email],
    subject,
    html: emailHtml
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: 200, body: JSON.stringify({ success: true }) });
        } else {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (e) => {
      resolve({ statusCode: 500, body: e.message });
    });
    req.write(payload);
    req.end();
  });
};