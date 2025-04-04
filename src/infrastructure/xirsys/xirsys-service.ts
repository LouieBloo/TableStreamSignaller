import axios from 'axios';

const backupIceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

export const getIceServerList = async (): Promise<any[]> => {
  if (!process.env.XIRSYS_API_KEY) { return backupIceServers }

  const channelPath = 'TableStream'; // replace with your Xirsys channel/app name
  const username = 'table-stream-admin';
  const secret = process.env.XIRSYS_API_KEY;

  const auth = Buffer.from(`${username}:${secret}`).toString('base64');

  const response = await axios.put(
    `https://global.xirsys.net/_turn/${channelPath}`,
    { format: 'urls' },
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if(!response || !response.data?.v?.iceServers){
    return backupIceServers;
  }

  let iceServers = response.data?.v?.iceServers || [];

  iceServers = iceServers.urls.map((url:any) => {
    if (url.startsWith('stun:')) {
      return { urls: url };
    } else {
      return {
        urls: url,
        username: iceServers.username,
        credential: iceServers.credential
      };
    }
  });

  return iceServers;
}

