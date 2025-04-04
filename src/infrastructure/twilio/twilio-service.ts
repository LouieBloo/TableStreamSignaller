import twilio from "twilio";
import { ApiV2010AccountTokenIceServers } from "twilio/lib/rest/api/v2010/account/token";

const client = twilio();

export const getIceServerList = async (): Promise<ApiV2010AccountTokenIceServers[]> => {
  if(!process.env.TWILIO_AUTH_TOKEN){return [{ urls: 'stun:stun.l.google.com:19302' }]}

  const token = await client.tokens.create();
  return token.iceServers;
}