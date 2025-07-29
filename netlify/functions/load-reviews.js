exports.handler = async (event, context) => {
  console.log('load-reviews function started');

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: 'Method not allowed' 
    };
  }

  try {
    // Import fetch for Node.js
    const fetch = (await import('node-fetch')).default;

    console.log('Fetching approved reviews from Airtable...');
    
    // FIXED: Changed 'Approved' to 'Approved :)' to match the dropdown option
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Reviews?filterByFormula=Status='Approved :)'&sort[0][field]=Timestamp&sort[0][direction]=desc`, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Airtable error:', errorText);
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully loaded ${data.records ? data.records.length : 0} approved reviews`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Error in load-reviews function:', error.message);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
