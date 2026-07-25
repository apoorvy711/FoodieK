import { forwardRef, useEffect, useMemo, useState } from "react";
import { resolveMediaCandidates, resolveMediaUrl } from "../../utils/media";

const defaultFallbackImage = "/media/hero.png";

const ResilientVideo = forwardRef(function ResilientVideo(
  {
    src,
    poster,
    fallbackImage = defaultFallbackImage,
    className,
    fallbackClassName,
    onFinalError,
    ...videoProps
  },
  ref,
) {
  const sourceCandidates = useMemo(() => resolveMediaCandidates(src), [src]);

  const posterCandidates = useMemo(() => {
    const options = [
      ...resolveMediaCandidates(poster),
      resolveMediaUrl(fallbackImage, defaultFallbackImage),
      defaultFallbackImage,
    ];

    return Array.from(new Set(options.filter(Boolean)));
  }, [fallbackImage, poster]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setFallbackMode(false);
  }, [src]);

  const currentSource = sourceCandidates[sourceIndex] || "";
  const currentPoster = posterCandidates[0] || defaultFallbackImage;

  const handleError = () => {
    if (sourceIndex + 1 < sourceCandidates.length) {
      setSourceIndex((index) => index + 1);
      return;
    }

    setFallbackMode(true);
    onFinalError?.();
  };

  if (fallbackMode || !currentSource) {
    return (
      <img
        src={currentPoster}
        alt="Food preview"
        className={fallbackClassName || className}
        loading="lazy"
        decoding="async"
        onError={(event) => {
          event.currentTarget.src = defaultFallbackImage;
        }}
      />
    );
  }

  return (
    <video
      ref={ref}
      key={currentSource}
      src={currentSource}
      poster={currentPoster}
      className={className}
      onError={handleError}
      {...videoProps}
    />
  );
});

export default ResilientVideo;
