import { 
  FaInstagram, 
  FaYoutube, 
  FaTiktok, 
  FaSnapchatGhost 
} from 'react-icons/fa';

interface SocialIconProps {
  className?: string;
  size?: number;
}

export const InstagramIcon = ({ className, size = 20 }: SocialIconProps) => (
  <div 
    className={`flex items-center justify-center rounded-lg ${className}`}
    style={{
      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    }}
  >
    <FaInstagram color="white" size={size} />
  </div>
);

export const YouTubeIcon = ({ className, size = 20 }: SocialIconProps) => (
  <div 
    className={`flex items-center justify-center rounded-lg bg-[#FF0000] ${className}`}
  >
    <FaYoutube color="white" size={size} />
  </div>
);

export const TikTokIcon = ({ className, size = 20 }: SocialIconProps) => (
  <div 
    className={`flex items-center justify-center rounded-lg bg-black ${className}`}
  >
    <FaTiktok color="white" size={size} />
  </div>
);

export const SnapchatIcon = ({ className, size = 20 }: SocialIconProps) => (
  <div 
    className={`flex items-center justify-center rounded-lg bg-[#FFFC00] ${className}`}
  >
    <FaSnapchatGhost color="black" size={size} />
  </div>
);

// Inline versions without background container - just the icon with brand colors
export const InstagramIconInline = ({ className, size = 16 }: SocialIconProps) => (
  <FaInstagram 
    className={className}
    size={size} 
    style={{ 
      fill: 'url(#instagram-gradient)',
    }}
  />
);

export const YouTubeIconInline = ({ className, size = 16 }: SocialIconProps) => (
  <FaYoutube className={className} size={size} color="#FF0000" />
);

export const TikTokIconInline = ({ className, size = 16 }: SocialIconProps) => (
  <FaTiktok className={className} size={size} color="#000000" />
);

export const SnapchatIconInline = ({ className, size = 16 }: SocialIconProps) => (
  <FaSnapchatGhost className={className} size={size} color="#FFFC00" />
);

// Helper to get icon by platform name
export const getSocialIcon = (platform: string, size: number = 20, containerClass: string = "w-10 h-10 p-2") => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <InstagramIcon className={containerClass} size={size} />;
    case 'youtube':
      return <YouTubeIcon className={containerClass} size={size} />;
    case 'tiktok':
      return <TikTokIcon className={containerClass} size={size} />;
    case 'snapchat':
      return <SnapchatIcon className={containerClass} size={size} />;
    default:
      return null;
  }
};

export const getSocialIconInline = (platform: string, size: number = 16, className?: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <FaInstagram size={size} className={className} color="#E4405F" />;
    case 'youtube':
      return <FaYoutube size={size} className={className} color="#FF0000" />;
    case 'tiktok':
      return <FaTiktok size={size} className={className} color="#ffffff" />;
    case 'snapchat':
      return <FaSnapchatGhost size={size} className={className} color="#FFFC00" />;
    default:
      return null;
  }
};
