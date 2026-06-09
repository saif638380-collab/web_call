import { NextResponse } from 'next/server';
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function POST(req) {
  try {
    const { accountSid, apiKey, apiSecret, twimlAppSid } = await req.json();

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      return NextResponse.json({ error: 'Missing required Twilio credentials' }, { status: 400 });
    }

    // Generate a random identity for the client
    const identity = 'web_dialer_user_' + Math.random().toString(36).substring(7);

    // Create an access token which we will sign and return to the client
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
    });

    // Create a Voice grant and add it to the token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true, // Optional: allow incoming calls
    });

    token.addGrant(voiceGrant);

    return NextResponse.json({ token: token.toJwt(), identity });
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
