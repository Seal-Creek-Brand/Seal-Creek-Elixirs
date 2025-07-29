exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { id, action } = event.queryStringParameters;

    if (action === 'approve') {
      // Update record status to Approved
      await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Status: 'Approved'
          }
        })
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html'
        },
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: green;">✅ Review Approved!</h2>
              <p>The review is now live on your website.</p>
            </body>
          </html>
        `
      };

    } else if (action === 'reject') {
      // Delete the record
      await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        }
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html'
        },
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: red;">❌ Review Rejected</h2>
              <p>The review has been deleted.</p>
            </body>
          </html>
        `
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
