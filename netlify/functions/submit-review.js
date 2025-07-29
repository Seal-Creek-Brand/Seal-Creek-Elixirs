exports.handler = async (event, context) => {
  console.log('Function started');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    console.log('Parsing request body...');
    const { name, email, rating, review } = JSON.parse(event.body);
    console.log('Data received:', { name, rating });

    // Import fetch for Node.js
    const fetch = (await import('node-fetch')).default;
    
    console.log('Making Airtable API call...');
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Reviews`, {
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

    console.log('Airtable response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Airtable error:', errorText);
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

    console.log('Success!');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Review submitted successfully!' })
    };

  } catch (error) {
    console.log('Error caught:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
