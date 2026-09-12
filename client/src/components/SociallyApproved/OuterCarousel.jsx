import { memo, useCallback, useEffect, useRef, useState } from 'react';
import VideoCard from './VideoCard';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { useDragScroll } from '../../hooks/useDragScroll';
import './OuterCarousel.css';

function OuterCarousel({ videoIds, onOpen }) {
  const railRef = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useDragScroll(railRef);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    let frame = 0;

    const update = () => {
      frame = 0;
      const atStart = rail.scrollLeft <= 2;
      const atEnd = Math.ceil(rail.scrollLeft + rail.clientWidth) >= rail.scrollWidth - 2;
      setEdges((previous) =>
        previous.atStart === atStart && previous.atEnd === atEnd ? previous : { atStart, atEnd }
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    rail.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      rail.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [videoIds.length]);

  const scrollByPage = useCallback((direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({
      left: direction * Math.max(240, rail.clientWidth * 0.85),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  const onKeyDown = useCallback(
    (event) => {
      const rail = railRef.current;
      if (!rail) return;
      if (event.key === 'Home') {
        event.preventDefault();
        rail.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (event.key === 'End') {
        event.preventDefault();
        rail.scrollTo({ left: rail.scrollWidth, behavior: 'smooth' });
      } else if (event.key === 'PageDown') {
        event.preventDefault();
        scrollByPage(1);
      } else if (event.key === 'PageUp') {
        event.preventDefault();
        scrollByPage(-1);
      }
    },
    [scrollByPage]
  );

  return (
    <div className="sa-rail-wrap">
      <button
        type="button"
        className="sa-rail__arrow sa-rail__arrow--prev"
        onClick={() => scrollByPage(-1)}
        disabled={edges.atStart}
        aria-label="Scroll to previous videos"
      >
        <ChevronLeftIcon width={22} height={22} />
      </button>

      <ul
        ref={railRef}
        className="sa-rail"
        tabIndex={0}
        aria-label={`${videoIds.length} customer videos`}
        onKeyDown={onKeyDown}
      >
        {videoIds.map((id) => (
          <li className="sa-rail__item" key={id}>
            <VideoCard videoId={id} onOpen={onOpen} />
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="sa-rail__arrow sa-rail__arrow--next"
        onClick={() => scrollByPage(1)}
        disabled={edges.atEnd}
        aria-label="Scroll to more videos"
      >
        <ChevronRightIcon width={22} height={22} />
      </button>
    </div>
  );
}

export default memo(OuterCarousel);
