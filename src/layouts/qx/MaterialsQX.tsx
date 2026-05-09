'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m, useInView } from 'framer-motion';
import Image from 'next/image';
import type { MaterialsConfiguratorOption, MaterialsData } from '@/types/catalog';
import { SECTION_REVEAL_SETTLE, slowTransition } from '@/lib/motion';
import { QxText } from '@/components/catalog/QxText';
import { responsiveImg } from '@/lib/responsive-image';
import { MaterialsOptionGroup } from '@/components/catalog/MaterialsOptionGroup';

interface MaterialsSectionProps {
  data: MaterialsData;
}

const EMPTY_MATERIAL_OPTIONS: MaterialsConfiguratorOption[] = [];
const DESKTOP_PRICE_GROUP_1 = ['U100', 'U110', 'U120', 'U130', 'W200', 'W220'];
const DESKTOP_PRICE_GROUP_2 = ['W210', 'W240', 'W250', 'W310', 'W330'];
const FRAME_COLOR_ORDER = ['RAL9006', 'RAL9005', 'RAL9003', 'RAL7024'];

const METRO_ID_PATTERN = /^metro[_ -]/i;

function pickConfiguratorOption(
  options: MaterialsConfiguratorOption[],
  code: string,
): MaterialsConfiguratorOption | undefined {
  const matches = options.filter((option) => option.code === code);
  if (matches.length === 0) return undefined;

  const metroEntry = matches.find((option) => METRO_ID_PATTERN.test(option.id));
  const swatchEntry = matches.find(
    (option) => !METRO_ID_PATTERN.test(option.id),
  );

  if (metroEntry && swatchEntry) {
    return {
      ...metroEntry,
      label: swatchEntry.label,
      thumbnail: swatchEntry.image,
    };
  }
  return metroEntry ?? swatchEntry ?? matches[0];
}

function dedupeByCode(options: MaterialsConfiguratorOption[]) {
  const seen = new Set<string>();
  const result: MaterialsConfiguratorOption[] = [];
  for (const option of options) {
    if (seen.has(option.code)) continue;
    const preferred = pickConfiguratorOption(options, option.code);
    if (!preferred) continue;
    seen.add(option.code);
    result.push(preferred);
  }
  return result;
}

function orderOptions(
  options: MaterialsConfiguratorOption[],
  orderedCodes: string[],
) {
  return orderedCodes.flatMap((code) => {
    const option = pickConfiguratorOption(options, code);
    return option ? [option] : [];
  });
}

const MaterialsQX = ({ data }: MaterialsSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const reveal = SECTION_REVEAL_SETTLE;
  const sourceFrameOptions =
    data.configurator?.frameOptions ?? EMPTY_MATERIAL_OPTIONS;
  const sourceDesktopOptions =
    data.configurator?.desktopOptions ?? EMPTY_MATERIAL_OPTIONS;
  const dedupedFrameOptions = useMemo(
    () => dedupeByCode(sourceFrameOptions),
    [sourceFrameOptions],
  );
  const dedupedDesktopOptions = useMemo(
    () => dedupeByCode(sourceDesktopOptions),
    [sourceDesktopOptions],
  );
  const frameOptions = useMemo(() => {
    const ordered = orderOptions(dedupedFrameOptions, FRAME_COLOR_ORDER);
    const orderedCodes = new Set(ordered.map((option) => option.code));
    const leftovers = dedupedFrameOptions.filter(
      (option) => !orderedCodes.has(option.code),
    );
    return [...ordered, ...leftovers];
  }, [dedupedFrameOptions]);
  const desktopPriceGroup1 = useMemo(
    () => orderOptions(dedupedDesktopOptions, DESKTOP_PRICE_GROUP_1),
    [dedupedDesktopOptions],
  );
  const desktopPriceGroup2 = useMemo(
    () => orderOptions(dedupedDesktopOptions, DESKTOP_PRICE_GROUP_2),
    [dedupedDesktopOptions],
  );
  const desktopLeftovers = useMemo(() => {
    const knownCodes = new Set([
      ...DESKTOP_PRICE_GROUP_1,
      ...DESKTOP_PRICE_GROUP_2,
    ]);
    return dedupedDesktopOptions.filter(
      (option) => !knownCodes.has(option.code),
    );
  }, [dedupedDesktopOptions]);
  const desktopOptions = useMemo(
    () => [...desktopPriceGroup1, ...desktopPriceGroup2, ...desktopLeftovers],
    [desktopPriceGroup1, desktopPriceGroup2, desktopLeftovers],
  );
  const hasGroupedDesktop =
    desktopPriceGroup1.length > 0 || desktopPriceGroup2.length > 0;
  const hasConfigurator = frameOptions.length > 0 && desktopOptions.length > 0;
  const [selectedFrameId, setSelectedFrameId] = useState(
    frameOptions[0]?.id ?? '',
  );
  const [selectedDesktopId, setSelectedDesktopId] = useState(
    desktopOptions[0]?.id ?? '',
  );

  useEffect(() => {
    setSelectedFrameId((current) =>
      frameOptions.some((option) => option.id === current)
        ? current
        : (frameOptions[0]?.id ?? ''),
    );
  }, [frameOptions]);

  useEffect(() => {
    setSelectedDesktopId((current) =>
      desktopOptions.some((option) => option.id === current)
        ? current
        : (desktopOptions[0]?.id ?? ''),
    );
  }, [desktopOptions]);

  const selectedFrame =
    frameOptions.find((option) => option.id === selectedFrameId) ??
    frameOptions[0];
  const selectedDesktop =
    desktopOptions.find((option) => option.id === selectedDesktopId) ??
    desktopOptions[0];
  const configuratorAlt =
    selectedFrame && selectedDesktop
      ? `Metro desk with desktop ${selectedDesktop.label} and frame ${selectedFrame.label}`
      : data.detailImageAlt;

  return (
    <section
      id="materials"
      className="bg-surface-elevated lg:min-h-[960px]"
      aria-labelledby="materials-title"
    >
      <div
        className="relative mx-auto w-full max-w-[1440px] px-5 pt-6 pb-12 sm:px-8 sm:pt-8 lg:min-h-[960px] lg:px-0 lg:py-0"
        ref={ref}
      >
        <m.div
          initial={reveal.header.initial}
          animate={isInView ? reveal.header.animate : {}}
          transition={slowTransition({ duration: 0.6 })}
          className="relative z-10 flex flex-col lg:pt-3"
        >
          <p className="section_ID font-display uppercase">
            <QxText text={data.sectionLabel} />
          </p>
          <h2
            id="materials-title"
            className="section_Title mt-8 font-display font-normal lg:mt-7"
          >
            <QxText text={data.title} />
          </h2>
          {data.description && (
            <p className="sec_main_text mt-6 max-w-[633px]">
              <QxText text={data.description} />
            </p>
          )}
        </m.div>

        <m.div
          initial={reveal.content.initial}
          animate={isInView ? reveal.content.animate : {}}
          transition={slowTransition({ duration: 0.6, delay: 0.2 })}
          className="mt-8 space-y-5 lg:mt-8 lg:ml-auto lg:w-full lg:max-w-[721px]"
        >
          {hasConfigurator ? (
            <>
              {hasGroupedDesktop ? (
                <div>
                  <h3 className="mb-3 qx-emphasis-title">
                    <QxText text="Desktop Finish" />
                  </h3>
                  <div className="space-y-4">
                    {desktopPriceGroup1.length > 0 && (
                      <MaterialsOptionGroup
                        title="I-st price group"
                        options={desktopPriceGroup1}
                        selectedId={selectedDesktop?.id}
                        onSelect={setSelectedDesktopId}
                      />
                    )}
                    {desktopPriceGroup2.length > 0 && (
                      <MaterialsOptionGroup
                        title="II-nd price group"
                        options={desktopPriceGroup2}
                        selectedId={selectedDesktop?.id}
                        onSelect={setSelectedDesktopId}
                      />
                    )}
                    {desktopLeftovers.length > 0 && (
                      <MaterialsOptionGroup
                        title="Other"
                        options={desktopLeftovers}
                        selectedId={selectedDesktop?.id}
                        onSelect={setSelectedDesktopId}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <MaterialsOptionGroup
                  title="Desktop Finish"
                  options={desktopOptions}
                  selectedId={selectedDesktop?.id}
                  onSelect={setSelectedDesktopId}
                  variant="primary"
                />
              )}
              <MaterialsOptionGroup
                title="Steel parts colors"
                options={frameOptions}
                selectedId={selectedFrame?.id}
                onSelect={setSelectedFrameId}
                variant="primary"
              />
            </>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {data.swatches.map((swatch) => (
                <div key={swatch.name} className="text-center">
                  <div
                    className="aspect-square w-full shadow-md transition-transform hover:scale-110"
                    style={{ backgroundColor: swatch.hex }}
                    role="img"
                    aria-label={`${swatch.name} colour swatch`}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    <QxText text={swatch.name} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </m.div>

        <m.div
          initial={reveal.content.initial}
          animate={isInView ? reveal.content.animate : {}}
          transition={slowTransition({ duration: 0.3, delay: 0.35 })}
          className="mt-10 aspect-square w-full lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:aspect-auto lg:h-[715px] lg:w-[687px]"
        >
          {hasConfigurator && selectedFrame && selectedDesktop ? (
            <figure
              className="relative h-full w-full"
              role="img"
              aria-label={configuratorAlt}
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.img
                  key={`frame-${selectedFrame.image}`}
                  src={selectedFrame.image}
                  {...responsiveImg(selectedFrame.image, 'materials-full')}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={slowTransition({
                    duration: 0.22,
                    ease: 'easeOut',
                  })}
                />
              </AnimatePresence>

              <AnimatePresence mode="wait" initial={false}>
                <m.img
                  key={`desktop-${selectedDesktop.image}`}
                  src={selectedDesktop.image}
                  {...responsiveImg(selectedDesktop.image, 'materials-full')}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={slowTransition({
                    duration: 0.22,
                    ease: 'easeOut',
                  })}
                />
              </AnimatePresence>
            </figure>
          ) : (
            <figure className="group relative h-full w-full overflow-hidden">
              <Image
                src={data.detailImage}
                alt={data.detailImageAlt}
                fill
                sizes="(min-width: 1440px) 687px, (min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </figure>
          )}
        </m.div>
      </div>
    </section>
  );
};

export default MaterialsQX;
