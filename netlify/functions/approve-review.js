exports.handler = async (event, context) => {
  console.log('approve-review function started');

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { id, action } = event.queryStringParameters || {};
    console.log(`Received request: id=${id}, action=${action}`);

    if (!id) {
      console.log('Error: Missing review ID in query parameters.');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: red;">❌ Error: Missing Review ID</h2>
                <p>Could not process your request.</p>
              </body></html>`
      };
    }

    // Import fetch for Node.js
    const fetch = (await import('node-fetch')).default;
    console.log('node-fetch imported successfully.');

    if (action === 'approve') {
      console.log(`Attempting to APPROVE record with ID: ${id}`);
      
      const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Status: 'Approved :)'  // FIXED: Added the smiley face!
          }
        })
      });

      console.log('Airtable response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Airtable error response:', errorText);
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`Record ${id} successfully marked as Approved :) in Airtable.`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: green;">✅ Review Approved!</h2>
              <p>The review is now live on your website.</p>
              <p><a href="${process.env.URL || `https://${process.env.NETLIFY_SITE_NAME}.netlify.app`}" target="_blank">View your website</a></p>
            </body>
          </html>
        `
      };

    } else if (action === 'reject') {
      console.log(`Attempting to REJECT (delete) record with ID: ${id}`);
      
      const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        }
      });

      console.log('Airtable response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Airtable error response:', errorText);
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
      }

      console.log(`Record ${id} successfully deleted from Airtable.`);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: red;">❌ Review Rejected</h2>
              <p>The review has been deleted.</p>
              <p><a href="${process.env.URL || `https://${process.env.NETLIFY_SITE_NAME}.netlify.app`}" target="_blank">View your website</a></p>
            </body>
          </html>
        `
      };

    } else {
      console.log('Error: Invalid action parameter provided.');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: red;">❌ Error: Invalid Action</h2>
                <p>Action must be 'approve' or 'reject'.</p>
              </body></html>`
      };
    }

  } catch (error) {
    console.error('Error caught in approve-review function:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: red;">Fatal Error</h2>
              <p>An unexpected error occurred: ${error.message}</p>
            </body></html>`
    };
  }
};
