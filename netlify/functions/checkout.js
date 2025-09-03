// This is the code for your file at: netlify/functions/checkout.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { quantity } = JSON.parse(event.body);

    // Validate the quantity
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity < 1 || numQuantity > 30) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid quantity.' }),
      };
    }

    // Create the Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US'], // Adjust allowed countries as needed
      },
      mode: 'payment',
      
      line_items: [
        {
          // Your Price ID has been added here
          price: 'price_1S2cPM1Xz1RJ20NoiXV3ecKB', 
          quantity: numQuantity, // Use the quantity from the user's request
        },
      ],
      
      // 🚨 Remember to replace these with your actual URLs
      success_url: `https://your-website.com/success`, 
      cancel_url: `https://your-website.com/`, // You can link back to the main page
    });

    // Return the session URL to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
      headers: {
        'Access-Control-Allow-Origin': '*', // Allows your website to call this function
      },
    };

  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session.' }),
    };
  }
};
