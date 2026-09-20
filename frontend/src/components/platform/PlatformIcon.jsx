import { useEffect, useState } from 'react';
import { getPlatformAsset } from '../../config/platformAssets';

const PlatformIcon = ({ slug, name, fallback, size = 'md', className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [slug]);
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`flex ${sizeClasses[size] || sizeClasses.md} ${className} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 text-sm font-bold uppercase text-white shadow-sm`}>
      {!imageFailed && getPlatformAsset(slug) ? (
        <img
          src={getPlatformAsset(slug)}
          alt={name || slug || 'Platform'}
          className="h-full w-full object-contain p-2"
          onError={() => setImageFailed(true)}
        />
      ) : (
        fallback || slug?.slice(0, 2) || '?'
      )}
    </div>
  );
};

export default PlatformIcon;
