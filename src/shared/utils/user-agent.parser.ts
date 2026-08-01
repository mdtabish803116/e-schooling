export interface ParsedUserAgent {
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown';
  deviceName: string;
  browser: string;
  browserVersion: string | null;
  operatingSystem: string;
}

export function parseUserAgent(uaString?: string): ParsedUserAgent {
  if (!uaString) {
    return {
      deviceType: 'Unknown',
      deviceName: 'Unknown Device',
      browser: 'Unknown Browser',
      browserVersion: null,
      operatingSystem: 'Unknown OS',
    };
  }

  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' = 'Desktop';
  let deviceName = 'Desktop PC';
  let browser = 'Unknown Browser';
  let browserVersion: string | null = null;
  let operatingSystem = 'Unknown OS';

  // Operating System & Device Name
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(uaString)) {
    deviceType = 'Tablet';
    deviceName = /iPad/i.test(uaString) ? 'iPad' : 'Android Tablet';
  } else if (/Mobile|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(uaString)) {
    deviceType = 'Mobile';
    if (/iPhone/i.test(uaString)) deviceName = 'iPhone';
    else if (/iPod/i.test(uaString)) deviceName = 'iPod';
    else if (/Android/i.test(uaString)) deviceName = 'Android Device';
    else deviceName = 'Mobile Device';
  }

  if (/Windows NT 10.0/i.test(uaString)) operatingSystem = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(uaString)) operatingSystem = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(uaString)) operatingSystem = 'Windows 7';
  else if (/Windows/i.test(uaString)) operatingSystem = 'Windows';
  else if (/Mac OS X/i.test(uaString)) operatingSystem = 'macOS';
  else if (/Android/i.test(uaString)) operatingSystem = 'Android';
  else if (/iPhone OS|CPU OS/i.test(uaString)) operatingSystem = 'iOS';
  else if (/Linux/i.test(uaString)) operatingSystem = 'Linux';

  // Browser & Version
  if (/Edg\/([\d.]+)/i.test(uaString)) {
    browser = 'Microsoft Edge';
    browserVersion = uaString.match(/Edg\/([\d.]+)/i)?.[1] || null;
  } else if (/Chrome\/([\d.]+)/i.test(uaString)) {
    browser = 'Google Chrome';
    browserVersion = uaString.match(/Chrome\/([\d.]+)/i)?.[1] || null;
  } else if (/Firefox\/([\d.]+)/i.test(uaString)) {
    browser = 'Mozilla Firefox';
    browserVersion = uaString.match(/Firefox\/([\d.]+)/i)?.[1] || null;
  } else if (/Safari\/([\d.]+)/i.test(uaString) && !/Chrome/i.test(uaString)) {
    browser = 'Apple Safari';
    browserVersion = uaString.match(/Version\/([\d.]+)/i)?.[1] || null;
  } else if (/OPR\/([\d.]+)|Opera/i.test(uaString)) {
    browser = 'Opera';
    browserVersion = uaString.match(/OPR\/([\d.]+)/i)?.[1] || null;
  }

  return {
    deviceType,
    deviceName,
    browser,
    browserVersion,
    operatingSystem,
  };
}
