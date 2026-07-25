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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
    setFallbackMode(false);
    setRetryCount(0);
  }, [src]);

  const currentSource = sourceCandidates[sourceIndex] || "";
  const currentPoster = posterCandidates[0] || defaultFallbackImage;

  const handleError = (event) => {
    const mediaErrorCode = event.currentTarget?.error?.code;

    // Ignore aborts triggered by source cancellation/navigation.
    if (mediaErrorCode === 1) {
      return;
    }

    if (sourceIndex + 1 < sourceCandidates.length) {
      setSourceIndex((index) => index + 1);
      return;
    }

    // Retry once for transient network/decode issues before falling back.
    if ((mediaErrorCode === 2 || mediaErrorCode === 3) && retryCount < 1) {
      setRetryCount((count) => count + 1);
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
      key={`${currentSource}-${retryCount}`}
      src={currentSource}
      poster={currentPoster}
      className={className}
      onError={handleError}
      {...videoProps}
    />
  );
});

export default ResilientVideo;
