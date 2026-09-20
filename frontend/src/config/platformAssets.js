export const platformAssets = {
  facebook: '/assets/platforms/icon_facebook.png',
  instagram: '/assets/platforms/icon_ig.png',
  tiktok: '/assets/platforms/icon_tiktok.png',
  locket: '/assets/platforms/icon_locket.png',
  capcut: '/assets/platforms/icon_capcut.png',
  chatgpt: '/assets/platforms/icon_chatgpt.png',
  gemini: '/assets/platforms/icon_gemini.png',
  claude: '/assets/platforms/icon_claude.png',
  meitu: '/assets/platforms/icon_meitu.png',
  wink: '/assets/platforms/icon_wink.png',
};

export const getPlatformAsset = (slug) => platformAssets[String(slug || '').toLowerCase().trim()];

export const platformPageConfig = {
  facebook: {
    title: 'Facebook',
    subtitle: 'Dịch vụ Facebook',
    description: 'Tăng tương tác và phát triển nội dung Facebook.',
    fallback: 'f',
  },
  instagram: {
    title: 'Instagram',
    subtitle: 'Dịch vụ Instagram',
    description: 'Phát triển lượt theo dõi và tương tác Instagram.',
    fallback: 'ig',
  },
  tiktok: {
    title: 'TikTok',
    subtitle: 'Dịch vụ TikTok',
    description: 'Tăng khả năng tiếp cận và tương tác TikTok.',
    fallback: 'tk',
  },
  locket: {
    title: 'Locket',
    subtitle: 'Dịch vụ Locket',
    description: 'Dịch vụ hỗ trợ trải nghiệm và tương tác Locket.',
    fallback: 'lo',
  },
  capcut: {
    title: 'CapCut',
    subtitle: 'Dịch vụ CapCut',
    description: 'Dịch vụ hỗ trợ tài khoản và nội dung CapCut.',
    fallback: 'cc',
  },
  chatgpt: {
    title: 'ChatGPT',
    subtitle: 'Dịch vụ ChatGPT',
    description: 'Dịch vụ hỗ trợ các gói và tiện ích ChatGPT.',
    fallback: 'cg',
  },
  gemini: {
    title: 'Gemini',
    subtitle: 'Dịch vụ Gemini',
    description: 'Dịch vụ hỗ trợ tài khoản và tiện ích Gemini.',
    fallback: 'ge',
  },
  claude: {
    title: 'Claude',
    subtitle: 'Dịch vụ Claude',
    description: 'Dịch vụ hỗ trợ tài khoản và tiện ích Claude.',
    fallback: 'cl',
  },
  meitu: {
    title: 'Meitu',
    subtitle: 'Dịch vụ Meitu',
    description: 'Dịch vụ hỗ trợ tài khoản và tính năng Meitu.',
    fallback: 'me',
  },
  wink: {
    title: 'Wink',
    subtitle: 'Dịch vụ Wink',
    description: 'Dịch vụ hỗ trợ tài khoản và tính năng Wink.',
    fallback: 'wi',
  },
};
