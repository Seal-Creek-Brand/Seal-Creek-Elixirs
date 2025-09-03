// FINAL VERSION: /netlify/functions/checkout.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// This is the main function that Netlify will run
exports.handler = async function(event) {
  
  // ---> PERMISSION HEADERS START <---
  // These headers give your GitHub page permission to talk to this function
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allows any domain to request
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS' // Allow POST and the OPTIONS pre-flight request
  };

  // Browsers send a pre-flight "OPTIONS" request to ask for permission first.
  // This part of the code handles that by responding with a "200 OK" and the headers.
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'This was a preflight request'
    };
  }
  // ---> PERMISSION HEADERS END <---


  // The rest of your function logic
  try {
    const { quantity } = JSON.parse(event.body);

    const numQuantity = Number(quantity);
    if (!Number.isInteger(numQuantity) || numQuantity < 1 || numQuantity > 100) {
      throw new Error("Invalid quantity specified.");
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        // --- THIS IS THE ONLY LINE THAT HAS BEEN CHANGED ---
        price: process.env.STRIPE_VAR_QUANTITY_PRICE_ID, 
        quantity: numQuantity,
      }],
      mode: 'payment',
      success_url: `https://sealcreekelixirs.com/success.html`,
      cancel_url: `https://sealcreekelixirs.com`, 
    });

    // We must return the headers with the final response as well
    return {
      statusCode: 200,
      headers, 
      body: JSON.stringify({
        url: session.url
      }),
    };

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    // And also with any error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Sorry, we couldn't create a checkout session."
      }),
    };
  }
};
