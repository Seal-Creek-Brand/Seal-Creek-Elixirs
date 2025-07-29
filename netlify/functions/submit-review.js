exports.handler = async (event, context) => {
  try {
    const { name, email, rating, review } = JSON.parse(event.body);
    console.log('Form data:', { name, email, rating, review });

    const fetch = (await import('node-fetch')).default;
    
    const airtableData = {
      fields: {
        Name: name,
        Email: email,
        Rating: parseInt(rating), // Convert string to number!
        Review: review,
        Status: 'Pending',
        Timestamp: new Date().toISOString()
      }
    };
    
    console.log('Sending to Airtable:', JSON.stringify(airtableData, null, 2));

    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Airtable error:', errorText);
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

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
