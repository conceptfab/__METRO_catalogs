'use client';

import { useRef } from 'react';
import { m, useInView } from 'framer-motion';
import Image from 'next/image';
import type { ProductCodeGroup, ProductCodesData } from '@/types/catalog';
import { SECTION_REVEAL_SETTLE, slowTransition } from '@/lib/motion';
import { QxText } from '@/components/catalog/QxText';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductCodesSectionProps {
  data: ProductCodesData;
}

const DIMENSION_KEYS = ['width', 'depth', 'height'] as const;

const ProductCodeTable = ({ group, open }: { group: ProductCodeGroup; open: boolean }) => (
  <details
    open={open}
    className="codes-accordion grid w-full grid-rows-subgrid row-span-2 gap-y-1 lg:w-[343px]"
  >
    <summary>
      <h3 className="font-body text-[15px] font-medium leading-tight text-foreground/90 sm:text-[13px] sm:font-normal sm:text-foreground/65">
        <QxText text={group.title} />
      </h3>
    </summary>
    <div className="codes-accordion__content">
      <table
        className="w-full table-fixed border-separate border-spacing-0 text-[13px]"
        role="table"
      >
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[17%]" />
          <col className="w-[15%]" />
          <col className="w-[34%]" />
        </colgroup>
        <thead>
          <tr className="bg-product-header font-bold text-accent-foreground">
            <th className="px-3 py-1.5 text-left lowercase">index</th>
            <th className="px-2 py-1.5 text-left lowercase">w</th>
            <th className="px-2 py-1.5 text-left lowercase">d</th>
            <th className="px-2 py-1.5 text-left lowercase">h</th>
          </tr>
        </thead>
        <tbody className="font-body text-product-text">
          {group.rows.map((row) => {
            const dimensions = row.dimensions.split('×').map((part, position, all) => ({
              key: DIMENSION_KEYS[position] ?? part.trim(),
              value: part.trim(),
              hasRightBorder: position < all.length - 1,
            }));
            return (
              <tr key={`${group.id}-${row.index}`}>
                <td className="border-r-2 border-t-2 border-surface-elevated bg-product-muted px-3 py-1.5 font-medium">
                  {row.index}
                </td>
                {dimensions.map((dimension) => (
                  <td
                    key={`${row.index}-${dimension.key}`}
                    className={`whitespace-nowrap border-t-2 border-surface-elevated bg-product-muted px-2 py-1.5 ${
                      dimension.hasRightBorder ? 'border-r-2' : ''
                    }`}
                  >
                    {dimension.value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </details>
);

const ProductCodesQX = ({ data }: ProductCodesSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const reveal = SECTION_REVEAL_SETTLE;
  const isMobile = useIsMobile();
  const desktopOpen = !isMobile;
  const singleDeskGroups = data.groups.filter(
    (group) => group.category === 'single',
  );
  const benchGroups = data.groups.filter((group) => group.category === 'bench');
  const managerGroups = data.groups.filter(
    (group) => group.category === 'manager',
  );

  return (
    <section
      id="codes"
      className="bg-surface-elevated lg:min-h-[960px]"
      aria-labelledby="codes-title"
    >
      <div
        className="relative mx-auto w-full max-w-[1440px] px-5 pt-6 pb-12 sm:px-8 sm:pt-8 lg:min-h-[960px] lg:px-0 lg:py-0"
        ref={ref}
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <m.div
            initial={reveal.header.initial}
            animate={isInView ? reveal.header.animate : {}}
            transition={slowTransition({ duration: 0.6 })}
            className="relative z-10 flex flex-col lg:col-span-6 lg:pt-3"
          >
            <p className="section_ID font-display uppercase">
              <QxText text={data.sectionLabel} />
            </p>
            <h2
              id="codes-title"
              className="section_Title mt-8 font-display font-normal lg:mt-7"
            >
              <QxText text={data.title} />
            </h2>
            <p className="sec_main_text mt-6 max-w-[633px]">
              <QxText text={data.description} />
            </p>
          </m.div>

          {data.image && (
            <div className="hidden items-start justify-end lg:col-span-6 lg:col-start-7 lg:flex lg:-mt-10 lg:translate-y-16">
              <m.div
                initial={reveal.content.initial}
                animate={isInView ? reveal.content.animate : {}}
                transition={slowTransition({ duration: 0.6, delay: 0.2 })}
              >
                <Image
                  src={data.image}
                  alt="Product codes diagram"
                  width={842}
                  height={842}
                  className="h-auto w-full max-w-[240px]"
                />
              </m.div>
            </div>
          )}
        </div>

        <m.div
          initial={reveal.content.initial}
          animate={isInView ? reveal.content.animate : {}}
          transition={slowTransition({ duration: 0.6, delay: 0.35 })}
          className="mt-7 space-y-12 lg:mt-7 lg:space-y-12"
        >
          {singleDeskGroups.length > 0 && (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold uppercase text-foreground/70">
                Single desks
              </h3>
              <div className="grid grid-cols-1 grid-rows-[auto_auto] gap-y-6 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-[calc((100%-1372px)/3)]">
                {singleDeskGroups.map((group) => (
                  <ProductCodeTable key={group.id} group={group} open={desktopOpen} />
                ))}
              </div>
            </div>
          )}

          {benchGroups.length > 0 && (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold uppercase text-foreground/70">
                Bench desks
              </h3>
              <div className="grid grid-cols-1 grid-rows-[auto_auto] gap-y-6 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-[calc((100%-1372px)/3)]">
                {benchGroups.map((group) => (
                  <ProductCodeTable key={group.id} group={group} open={desktopOpen} />
                ))}
              </div>
            </div>
          )}

          {(managerGroups.length > 0 || data.legend) && (
            <div>
              {managerGroups.length > 0 && (
                <h3 className="mb-2 font-display text-sm font-semibold uppercase text-foreground/70">
                  Manager desk
                </h3>
              )}
              <div className="grid grid-cols-1 grid-rows-[auto_auto] gap-y-6 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-[calc((100%-1372px)/3)]">
                {managerGroups.map((group) => (
                  <ProductCodeTable key={group.id} group={group} open={desktopOpen} />
                ))}
                {data.legend && (
                  <div className="flex items-end pb-1.5 lg:col-span-3 lg:pl-10">
                    <p className="font-body text-[13px] leading-tight text-foreground/65">
                      <QxText text={data.legend} />
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </m.div>
      </div>
    </section>
  );
};

export default ProductCodesQX;
