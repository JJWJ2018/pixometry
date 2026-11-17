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

  // Per-channel settings sent along with each job (Pixometry calls these "overrides").
  // They change one job without touching the channel in Pixometry.
  // The background-removal channel is set up in Pixometry to deliver a layered TIFF
  // (very large). Ask for a PNG with a transparent background instead.
  OVERRIDES: {
    'Enhancement+background removal': { output: { fileFormat: 'PNG' } },
  },

  // Extra buttons: an existing channel plus fixed settings for that one job.
  // The settings below are the example from the Pixometry API page.
  // saveAsNew: always a new file next to the original; suffix: added to its name.
  EXTRA_BUTTONS: [
    {
      label: 'Ready for web',
      hint: 'Enhance, max 2000 px, JPEG',
      channel: 'Image Enhancement',
      overrides: {
        size: { resampleActive: true, longestSizePixelsActive: true, longestSizePixels: 2000 },
        output: { fileFormat: 'JPEG', jpegQuality: 0.92 },
      },
      saveAsNew: true,
      suffix: '_web',
    },
    {
      // Channel "Inkleuren" in Pixometry (setting: colorize black-and-white).
      label: 'Colorize',
      hint: 'Turns a black-and-white image into colour',
      channel: 'Inkleuren',
      saveAsNew: true,
      suffix: '_color',
    },
    {
      // Channel "Uitvullen & slim croppen" in Pixometry. One action that does both:
      // it finds the subject (or the face, for a portrait), places the frame around it,
      // and where the frame needs more image than the photo has, generates the rest.
      // The frame size comes from the format the user picks (sent per job; the channel
      // itself is set to 500 x 500).
      label: 'Smart crop & fill',
      hint: 'Reframes around the subject, fills in what is missing',
      channel: 'Uitvullen & slim croppen',
      saveAsNew: true,
      formats: [
        { label: 'Portrait 4:5', width: 1080, height: 1350, suffix: '_portrait' },
        { label: 'Square 1:1', width: 1080, height: 1080, suffix: '_square' },
        { label: 'Story 9:16', width: 1080, height: 1920, suffix: '_story' },
        { label: 'Landscape 16:9', width: 1920, height: 1080, suffix: '_landscape' },
      ],
    },
  ],

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
