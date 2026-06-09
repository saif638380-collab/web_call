import { NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req) {
  try {
    // Twilio sends data as application/x-www-form-urlencoded
    const formData = await req.formData();
    const to = formData.get('To');
    // We can also receive the callerId if passed from the frontend, 
    // or just use the user's default number. Let's assume the frontend passes it in params.
    const callerId = formData.get('CallerId'); 

    const twiml = new VoiceResponse();

    if (to) {
      // Dial the number
      const dial = twiml.dial({
        callerId: callerId || '+1234567890', // Fallback if callerId isn't provided
      });
      
      // Check if it's a regular phone number (simplistic check)
      if (/^[\d\+\-\(\) ]+$/.test(to)) {
        dial.number(to);
      } else {
        dial.client(to);
      }
    } else {
      twiml.say('Thanks for calling! We could not find the destination number.');
    }

    // Return the TwiML as XML
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error generating TwiML:', error);
    return new NextResponse('<Response><Say>Application error</Say></Response>', {
      status: 500,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
