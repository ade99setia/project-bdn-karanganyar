import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.appbagusdinamikanusantara',
  appName: 'Bagus Dinamika Nusantara',
  webDir: 'public',
  server: {
    url: 'https://bdn.idnsolo.com',
    cleartext: true,
    allowNavigation: ['bdn.idnsolo.com'],
  }
};

export default config;
