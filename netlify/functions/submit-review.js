const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { name, email, rating, review } = JSON.parse(event.body);

    // Create Airtable record
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
          Rating: rating,
          Review: review,
          Status: 'Pending',
          Timestamp: new Date().toISOString()
        }
      })
    });

    const record = await airtableResponse.json();
    const recordId = record.id;

    // Send email notification
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.USER_GMAIL,
        pass: process.env.USER_GMAIL_PASS
      }
    });

    const approveUrl = `${process.env.URL}/.netlify/functions/approve-review?id=${recordId}&action=approve`;
    const rejectUrl = `${process.env.URL}/.netlify/functions/approve-review?id=${recordId}&action=reject`;

    await transporter.sendMail({
      from: process.env.USER_GMAIL,
      to: process.env.USER_GMAIL,
      subject: 'New Seal Creek Review to Approve',
      html: `
        <h3>New Review Submitted</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Rating:</strong> ${rating}/5</p>
        <p><strong>Review:</strong> ${review}</p>
        <br>
        <a href="${approveUrl}" style="background: green; color: white; padding: 10px; text-decoration: none;">APPROVE</a>
        <a href="${rejectUrl}" style="background: red; color: white; padding: 10px; text-decoration: none;">REJECT</a>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Review submitted successfully!' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
