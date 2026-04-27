const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch(e) {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { email } = body

  if (!email) {
    return { statusCode: 400, body: 'Missing email' }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'yellow — unlock messaging',
            description: 'Connect securely with SBU students. $1.99 first month, $4.99/month after.',
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: 199,
        },
        quantity: 1,
      }],
      success_url: 'https://joinyellow.net/success',
      cancel_url: 'https://joinyellow.net/hive',
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    }
  } catch(err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}