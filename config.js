// Configuration for the Pixometry panel plugin.
window.PLUGIN_CONFIG = {
  // Which Pixometry channels to show as buttons, by exact channel name.
  // Empty list = show every channel in the Pixometry account.
  CHANNELS: ['Image Enhancement', 'Enhancement+background removal', 'Enhancement+upscaling', 'Generative Enhancement'],

  // Friendly button labels and one-line explanations (optional, per channel name).
  LABELS: {
    'Image Enhancement': { label: 'Enhance', hint: 'Better light, colour and sharpness' },
    'Enhancement+background removal': { label: 'Remove background', hint: 'Enhance and cut out the subject' },
    'Enhancement+upscaling': { label: 'Enhance + upscale', hint: 'Enhance and enlarge small images' },
    'Generative Enhancement': { label: 'Generative enhance', hint: 'Cleans up noisy, low-quality images' },
  },

  // Channels whose result is always saved as a new file next to the original, never
  // as a new version (a cut-out is a different picture, not a better original).
  // Other channels: new version, or a new file when the file type changes.
  SAVE_AS_NEW: ['Enhancement+background removal'],

  // Only offer the buttons for these file types (lower case, no dot).
  FILE_TYPES: ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'webp'],

  // Backend (same Vercel deployment).
  API_BASE: '/api',

  // Optional shared secret. Must match the PLUGIN_SECRET env-var in Vercel.
  // Note: anything in this file is readable in the browser.
  PLUGIN_SECRET: '',

  // How often to ask whether Pixometry is done, and when to give up.
  POLL_INTERVAL_MS: 2500,
  POLL_TIMEOUT_MS: 180000,

  // Accent colour of the panel.
  BRAND_COLOR: '#0396e0',
};
