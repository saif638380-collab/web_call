import { NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req) {
  try {
    // Read the raw text body for Twilio's application/x-www-form-urlencoded payload
    const bodyText = await req.text();
    const formData = new URLSearchParams(bodyText);
    
    const to = formData.get('To');
    const callerId = formData.get('CallerId'); 

    const twiml = new VoiceResponse();

    if (to) {
      // Dial the number. Use the provided CallerId, or omit it if not provided.
      // If you don't provide a valid Twilio Caller ID, Twilio will reject the call.
      const dialOptions = {};
      if (callerId && callerId.trim() !== '') {
        dialOptions.callerId = callerId.trim();
      }
      
      const dial = twiml.dial(dialOptions);
      
      // Basic check to see if it's a phone number or client identifier
      if (/^[\d\+\-\(\) ]+$/.test(to)) {
        dial.number(to);
      } else {
        dial.client(to);
      }
    } else {
      twiml.say('Thanks for calling! We could not find the destination number.');
    }

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
