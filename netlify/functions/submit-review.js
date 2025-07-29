const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  console.log('Function started');

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: 'Method not allowed' 
    };
  }

  try {
    console.log('Parsing request body...');
    const { name, email, rating, review } = JSON.parse(event.body);
    console.log('Form data:', { name, email, rating, review });

    // Import fetch for Node.js (this is for the Airtable API call)
    const fetch = (await import('node-fetch')).default;

    // --- Airtable Record Creation ---
    console.log('Sending to Airtable:', JSON.stringify({
      fields: {
        Name: name,
        Email: email,
        Rating: parseInt(rating), // Ensure rating is an integer
        Review: review,
        Status: 'Pending',
        Timestamp: new Date().toISOString() // Sending ISO string for consistency
      }
    }, null, 2));

    const airtableResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          Email: email,
          Rating: parseInt(rating),
          Review: review,
          Status: 'Pending',
          Timestamp: new Date().toISOString()
        }
      })
    });

    if (!airtableResponse.ok) {
      const airtableErrorText = await airtableResponse.text();
      console.log('Airtable error:', airtableErrorText);
      throw new Error(`Airtable API error: ${airtableResponse.status} - ${airtableErrorText}`);
    }

    const record = await airtableResponse.json();
    const recordId = record.id;
    console.log('Airtable record created with ID:', recordId);

    // --- Email Notification ---
    console.log('Attempting to send email notification...');
    const transporter = nodemailer.createTransport({  // FIXED: removed 'er' from createTransporter
      service: 'gmail',
      auth: {
        user: process.env.USER_GMAIL, // Using your custom env var name
        pass: process.env.USER_GMAIL_PASS // Using your custom env var name
      }
    });

    // Ensure process.env.URL is set in Netlify environment variables
    const siteUrl = process.env.URL || `https://${process.env.NETLIFY_SITE_NAME}.netlify.app`;
    const approveUrl = `${siteUrl}/.netlify/functions/approve-review?id=${recordId}&action=approve`;
    const rejectUrl = `${siteUrl}/.netlify/functions/approve-review?id=${recordId}&action=reject`;

    console.log('Approval URL:', approveUrl);
    console.log('Rejection URL:', rejectUrl);

    await transporter.sendMail({
      from: process.env.USER_GMAIL,
      to: process.env.USER_GMAIL, // Sending to yourself for approval
      subject: 'New Seal Creek Review to Approve',
      html: `
        <h3>New Review Submitted for Seal Creek Elixirs</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Rating:</strong> ${rating}/5</p>
        <p><strong>Review:</strong> ${review}</p>
        <br>
        <a href="${approveUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">APPROVE REVIEW</a>
        <a href="${rejectUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">REJECT REVIEW</a>
        <br><br>
        <small>This review is currently in "Pending" status in Airtable.</small>
      `
    });
    console.log('Email notification sent successfully!');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ message: 'Review submitted successfully and awaiting approval!' })
    };
  } catch (error) {
    console.error('Error caught in submit-review function:', error.message);
    // Log detailed error if available
    if (error.response && error.response.data) {
        console.error('Detailed error response:', error.response.data);
    }
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: error.message || 'An unexpected error occurred.' })
    };
  }
};
