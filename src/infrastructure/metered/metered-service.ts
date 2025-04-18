import axios from 'axios';

const backupIceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.ekiga.net' },
  { urls: 'stun:stun.ideasip.com' },
  { urls: 'stun:stun.voiparound.com' },
  { urls: 'stun:stun.voipbuster.com' },
  { urls: 'stun:stun.voipstunt.com' },
  { urls: 'stun:stun.counterpath.net' },
  { urls: 'stun:stun.sipgate.net:10000' }
];

export const getIceServerList = async (): Promise<any[]> => {
  if (!process.env.METERED_API_KEY) { return backupIceServers }

  let servers = backupIceServers;

  try{
    const channelPath = 'TableStream'; // replace with your Xirsys channel/app name
    const username = 'table-stream-admin';
    const secret = process.env.METERED_API_KEY;
  
    const auth = Buffer.from(`${username}:${secret}`).toString('base64');
  
    const authResponse = await axios.post(
      `https://tablestream.metered.live/api/v1/turn/credential?secretKey=${secret}`,
      {
        "expiryInSeconds": 14400,
        // "label": "user-1"
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const serverResponse = await axios.get(`https://tablestream.metered.live/api/v1/turn/credentials?apiKey=${authResponse.data.apiKey}`);
  
    if(serverResponse && serverResponse.data){
      servers = servers.concat(serverResponse.data)
    }
  }catch(error){
    console.error("Error getting metered ICE servers: ", error)
    return backupIceServers;
  }

  

  return servers;
}

