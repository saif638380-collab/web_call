import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req) {
  try {
    const { sid, token } = await req.json();

    if (!sid || !token) {
      return NextResponse.json({ error: 'Missing Account SID or Auth Token' }, { status: 400 });
    }

    const client = twilio(sid, token);

    // Get the base URL from the request to set the Voice URL for the TwiML App
    const host = req.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const voiceUrl = `${protocol}://${host}/api/voice`;

    // Create a TwiML App
    const app = await client.applications.create({
      friendlyName: 'Next.js Web Dialer App',
      voiceMethod: 'POST',
      voiceUrl: voiceUrl,
    });

    // Create an API Key and Secret
    const apiKey = await client.newKeys.create({
      friendlyName: 'Next.js Web Dialer Key',
    });

    return NextResponse.json({
      apiKeySid: apiKey.sid,
      apiSecret: apiKey.secret,
      twimlAppSid: app.sid,
    });

  } catch (error) {
    console.error('Error generating Twilio keys:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
