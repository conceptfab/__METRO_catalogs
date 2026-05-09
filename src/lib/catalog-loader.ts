import type {
  CatalogData,
  HeroData,
  HeroSliderFile,
  HeroSlide,
  OverviewData,
  GalleryData,
  FinishesData,
  DimensionsData,
  MaterialsData,
  MaterialsConfiguratorData,
  MaterialsConfiguratorOption,
  FeaturesData,
  GettingStartedData,
  ProductCodesData,
  PackshotsData,
} from '@/types/catalog';
import fs from 'fs/promises';
import path from 'path';
import { parseHeroContent } from './schemas/hero';
import { parsePackshotsContent } from './schemas/packshots';

type DiscoveredMaterialsOption = {
  code: string;
  type: 'frame' | 'desktop';
  label: string;
  image?: string;
  thumbnail?: string;
};

/** Raw gallery from JSON - images use `image` not `src` */
interface RawGalleryData extends Omit<GalleryData, 'images'> {
  images: Array<{ image: string; alt: string; category: string }>;
}

interface RawPackshotsData extends Omit<PackshotsData, 'groups'> {
  groups: Array<{
    model: string;
    label: string;
    desc?: string;
    items: Array<{
      code: string;
      name?: string;
      frameColorName?: string;
      frameColorCode?: string;
      frameColorHex?: string;
      desktopColorName?: string;
      desktopColorCode?: string;
      desktopColorHex?: string;
      colorName: string;
      colorCode?: string;
      colorHex?: string;
      image?: string;
    }>;
  }>;
}

export interface GlobalConfig {
  brandName: string;
  siteTitle: string;
  siteSubtitle: string;
  footerText: string;
  catalogListTitle: string;
}

const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  brandName: 'Metro',
  siteTitle: 'METRO',
  siteSubtitle: 'Product catalogs — browse by collection',
  footerText: 'CONCEPT / CREATION / EXECUTION BY CONCEPTFAB',
  catalogListTitle: 'Available catalogs',
};

export async function getGlobalConfig(): Promise<GlobalConfig> {
  const data = await readPublicJson<Partial<GlobalConfig>>('config.json');
  if (!data) return DEFAULT_GLOBAL_CONFIG;
  return { ...DEFAULT_GLOBAL_CONFIG, ...data };
}

const SECTION_ORDER = [
  'hero',
  'overview',
  'gallery',
  'finishes',
  'packshots',
  'dimensions',
  'materials',
  'features',
  'getting-started',
  'codes',
] as const;

const BASE = '/catalogs';

function catalogBase(catalogId: string): string {
  return `${BASE}/${catalogId}`;
}

const MAX_HERO_SLIDES = 20;
export const IMAGE_EXTENSION_PRIORITY = ['.webp'] as const;
const IMAGE_EXTENSION_PRIORITY_MAP = new Map<string, number>(
  IMAGE_EXTENSION_PRIORITY.map((ext, index) => [ext, index]),
);
export const WEBP_SOURCE_EXTENSIONS = new Set<string>();

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/** Helper to read JSON from public directory */
async function readPublicJson<T>(filePath: string): Promise<T | null> {
  try {
    const fullPath = path.join(PUBLIC_DIR, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function normalizeRelativeAssetPath(assetPath: string): string {
  return assetPath.replace(/\\/g, '/').replace(/^\/+/, '');
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function resolveImageUrl(base: string, assetPath: string): string {
  const normalizedBase = base.replace(/\/+$/g, '');
  const normalizedAssetPath = normalizeRelativeAssetPath(assetPath);
  return `${normalizedBase}/${normalizedAssetPath}`;
}

function toPublicFilePath(...segments: string[]): string {
  const normalizedSegments = segments.flatMap((segment) =>
    trimSlashes(segment).split('/').filter(Boolean),
  );

  return path.join(PUBLIC_DIR, ...normalizedSegments);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildImageCandidates(assetPath: string): string[] {
  const normalizedAssetPath = normalizeRelativeAssetPath(assetPath);
  const ext = path.posix.extname(normalizedAssetPath).toLowerCase();
  const parsed = path.posix.parse(normalizedAssetPath);

  if (!ext) {
    return IMAGE_EXTENSION_PRIORITY.map((candidateExt) =>
      path.posix.join(parsed.dir, `${parsed.name}${candidateExt}`),
    );
  }

  if (!WEBP_SOURCE_EXTENSIONS.has(ext)) {
    return [normalizedAssetPath];
  }

  return [
    path.posix.join(parsed.dir, `${parsed.name}.webp`),
    normalizedAssetPath,
  ];
}

async function resolveImage(base: string, assetPath: string): Promise<string> {
  if (!assetPath) return '';
  if (assetPath.startsWith('http') || assetPath.startsWith('/')) return assetPath;

  const normalizedAssetPath = normalizeRelativeAssetPath(assetPath);
  const candidates = buildImageCandidates(normalizedAssetPath);

  const existsResults = await Promise.all(
    candidates.map((candidate) => fileExists(toPublicFilePath(base, candidate))),
  );
  const firstHit = candidates[existsResults.indexOf(true)];
  if (firstHit) return resolveImageUrl(base, firstHit);

  return resolveImageUrl(base, normalizedAssetPath);
}

function buildPackshotName(
  model: string,
  item: RawPackshotsData['groups'][number]['items'][number],
): string {
  const frameColorName = item.frameColorName?.trim();
  const desktopColorName = item.desktopColorName?.trim() ?? item.colorName;
  return [model, frameColorName, desktopColorName]
    .filter(Boolean)
    .join(' / ');
}

/** Parallelized hero image discovery with limited batch size using fs */
async function discoverHeroImages(heroBaseUrl: string): Promise<string[]> {
  const heroDir = path.join(PUBLIC_DIR, heroBaseUrl);

  try {
    const files = await fs.readdir(heroDir);
    const heroFilesByName = new Map<string, string>();

    for (const file of files) {
      const normalizedFile = normalizeRelativeAssetPath(file);
      const parsed = path.posix.parse(normalizedFile);
      const ext = parsed.ext.toLowerCase();

      if (!parsed.name.startsWith('hero_')) continue;
      if (!IMAGE_EXTENSION_PRIORITY_MAP.has(ext)) continue;

      const current = heroFilesByName.get(parsed.name);
      const currentPriority = current
        ? (IMAGE_EXTENSION_PRIORITY_MAP.get(
            path.posix.extname(current).toLowerCase(),
          ) ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER;
      const nextPriority =
        IMAGE_EXTENSION_PRIORITY_MAP.get(ext) ?? Number.MAX_SAFE_INTEGER;

      if (!current || nextPriority < currentPriority) {
        heroFilesByName.set(parsed.name, normalizedFile);
      }
    }

    return [...heroFilesByName.entries()]
      .toSorted(([left], [right]) =>
        left.localeCompare(right, undefined, { numeric: true }),
      )
      .slice(0, MAX_HERO_SLIDES)
      .map(([, file]) => resolveImageUrl(heroBaseUrl, file));
  } catch {
    return [];
  }
}

function defaultHeroSlideAlt(
  baseAlt: string,
  index: number,
  total: number,
): string {
  return index === 0 ? baseAlt : `${baseAlt} - slide ${index + 1} of ${total}`;
}

function formatMaterialsOptionLabel(code: string): string {
  const normalizedCode = code.toUpperCase();
  if (normalizedCode.startsWith('RAL')) {
    return `RAL ${normalizedCode.slice(3)}`;
  }

  return normalizedCode;
}

function parseMaterialsOptionName(
  baseName: string,
): DiscoveredMaterialsOption | null {
  const normalizedName = baseName.replace(/^metro[_ -]*/i, '').trim();
  const match = normalizedName.match(/^(RAL\s*\d+|[UW]\d+)(?:[\s_-]+(.+))?$/i);
  if (!match) return null;

  const rawCode = match[1].replace(/\s+/g, '').toUpperCase();
  const type = resolveMaterialsAssetType(rawCode);
  if (!type) return null;

  const suffix = match[2]?.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const label = suffix
    ? `${formatMaterialsOptionLabel(rawCode)} ${suffix.toUpperCase()}`
    : formatMaterialsOptionLabel(rawCode);

  return {
    code: rawCode,
    type,
    label,
  };
}

function resolveMaterialsAssetType(
  code: string,
): 'frame' | 'desktop' | null {
  if (/^RAL\d+$/i.test(code)) return 'frame';
  if (/^[UW]\d+$/i.test(code)) return 'desktop';
  return null;
}

function compareMaterialsOptions(
  left: MaterialsConfiguratorOption,
  right: MaterialsConfiguratorOption,
): number {
  return left.code.localeCompare(right.code, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

const SHARED_MATERIALS_BASE = '/shared/materials';

export const SUPPORTED_MATERIAL_EXTENSIONS = new Set(['.webp']);

type ScannedMaterialsOption = {
  type: 'frame' | 'desktop';
  option: MaterialsConfiguratorOption;
};

async function scanMaterialsFolder(
  baseUrl: string,
): Promise<ScannedMaterialsOption[]> {
  const dir = toPublicFilePath(baseUrl);

  try {
    const files = await fs.readdir(dir);
    const options = new Map<string, DiscoveredMaterialsOption>();

    for (const file of files) {
      const normalizedFile = normalizeRelativeAssetPath(file);
      const parsed = path.posix.parse(normalizedFile);

      if (!SUPPORTED_MATERIAL_EXTENSIONS.has(parsed.ext.toLowerCase()))
        continue;
      if (/-\d+w$/i.test(parsed.name)) continue;

      const isThumbnail = parsed.name.endsWith('_thumb');
      const baseName = isThumbnail
        ? parsed.name.slice(0, -'_thumb'.length)
        : parsed.name;
      const parsedOption = parseMaterialsOptionName(baseName);
      if (!parsedOption) continue;

      const option = options.get(baseName) ?? parsedOption;
      if (isThumbnail) {
        option.thumbnail = normalizedFile;
      } else {
        option.image = normalizedFile;
      }
      options.set(baseName, option);
    }

    const result: ScannedMaterialsOption[] = [];
    for (const [id, option] of options.entries()) {
      if (!option.image) continue;
      const thumbnail = option.thumbnail ?? option.image;
      result.push({
        type: option.type,
        option: {
          id,
          code: option.code,
          label: option.label,
          image: resolveImageUrl(baseUrl, option.image),
          thumbnail: resolveImageUrl(baseUrl, thumbnail),
        },
      });
    }
    return result;
  } catch {
    return [];
  }
}

async function discoverMaterialsConfigurator(
  materialsBaseUrl: string,
  { includeShared = false }: { includeShared?: boolean } = {},
): Promise<MaterialsConfiguratorData | undefined> {
  const sources = [scanMaterialsFolder(materialsBaseUrl)];
  if (includeShared) {
    sources.push(scanMaterialsFolder(SHARED_MATERIALS_BASE));
  }
  const scanned = (await Promise.all(sources)).flat();

  const frameOptions: MaterialsConfiguratorOption[] = [];
  const desktopOptions: MaterialsConfiguratorOption[] = [];

  for (const { type, option } of scanned) {
    if (type === 'frame') {
      frameOptions.push(option);
    } else {
      desktopOptions.push(option);
    }
  }

  frameOptions.sort(compareMaterialsOptions);
  desktopOptions.sort(compareMaterialsOptions);

  if (frameOptions.length === 0 || desktopOptions.length === 0) {
    return undefined;
  }

  return {
    frameOptions,
    desktopOptions,
  };
}

async function normalizeHeroSlides(
  slides: HeroSliderFile['slides'] | undefined,
  heroBase: string,
  fallbackAlt: string,
): Promise<HeroSlide[] | undefined> {
  if (!slides || slides.length === 0) return undefined;

  const normalized = await Promise.all(
    slides.map(async (slide, index) => {
      const src = await resolveImage(heroBase, slide.image);
      if (!src) return null;

      return {
        src,
        alt:
          slide.alt?.trim() ||
          defaultHeroSlideAlt(fallbackAlt, index, slides.length),
        ...(slide.description ? { description: slide.description } : {}),
        ...(slide.heroContent && Object.keys(slide.heroContent).length > 0
          ? { heroContent: slide.heroContent }
          : {}),
        ...(slide.descriptionStyle &&
        Object.keys(slide.descriptionStyle).length > 0
          ? { descriptionStyle: slide.descriptionStyle }
          : {}),
        ...(slide.contentLayout &&
        Object.keys(slide.contentLayout).length > 0
          ? { contentLayout: slide.contentLayout }
          : {}),
        ...(slide.textStyle && Object.keys(slide.textStyle).length > 0
          ? { textStyle: slide.textStyle }
          : {}),
        ...(slide.mobileTextStyle &&
        Object.keys(slide.mobileTextStyle).length > 0
          ? { mobileTextStyle: slide.mobileTextStyle }
          : {}),
        ...(slide.mobileContentLayout &&
        Object.keys(slide.mobileContentLayout).length > 0
          ? { mobileContentLayout: slide.mobileContentLayout }
          : {}),
        ...(slide.mobileImageOffsetX
          ? { mobileImageOffsetX: slide.mobileImageOffsetX }
          : {}),
      };
    }),
  );

  const filtered = normalized.filter((slide): slide is HeroSlide => slide !== null);
  return filtered.length > 0 ? filtered : undefined;
}

interface CatalogIndex {
  catalogs: string[];
}

interface CatalogConfig {
  meta: CatalogData['meta'];
  sections: CatalogData['sections'];
}

interface CatalogContentFiles {
  hero: HeroData;
  heroSliderFile: HeroSliderFile | null;
  overview: OverviewData;
  gallery: RawGalleryData;
  finishes: FinishesData;
  dimensions: DimensionsData;
  materials: MaterialsData;
  features: FeaturesData;
  gettingStarted: GettingStartedData;
  productCodes: ProductCodesData;
  packshots: RawPackshotsData | null;
}

/** Lightweight loader for list view */
async function loadCatalogMeta(
  catalogId: string,
): Promise<{ id: string; meta: CatalogData['meta'] } | null> {
  const base = catalogBase(catalogId);
  const config = await readPublicJson<CatalogConfig>(`${base}/config.json`);
  if (!config) return null;
  return { id: catalogId, meta: config.meta };
}

export async function getCatalogList(): Promise<
  Array<{ id: string; meta: CatalogData['meta'] }>
> {
  let catalogs: string[] = [];

  const data = await readPublicJson<CatalogIndex>(`${BASE}/index.json`);
  if (data) {
    catalogs = data.catalogs ?? [];
  }

  const results = await Promise.all(catalogs.map((id) => loadCatalogMeta(id)));
  return results.filter(
    (item): item is { id: string; meta: CatalogData['meta'] } => item !== null,
  );
}

export interface CatalogFooterEntry {
  id: string;
  label: string;
  href: string;
  thumbnail: string;
  thumbnailAlt: string;
}

export async function getCatalogFooterEntries(): Promise<CatalogFooterEntry[]> {
  const list = await getCatalogList();
  const overviewBase = (id: string) => `${catalogBase(id)}/overview`;

  const entries = await Promise.all(
    list.map(async (item) => {
      const overview = await readPublicJson<OverviewData>(
        `${overviewBase(item.id)}/content.json`,
      );
      if (!overview?.packshotImage) return null;

      const thumbnail = await resolveImage(
        overviewBase(item.id),
        overview.packshotImage,
      );
      if (!thumbnail) return null;

      return {
        id: item.id,
        label: item.meta.collectionName ?? item.id,
        href: `/catalog/${item.id}`,
        thumbnail,
        thumbnailAlt:
          overview.packshotImageAlt?.trim() || `${item.id} catalogue preview`,
      } satisfies CatalogFooterEntry;
    }),
  );

  return entries.filter((entry): entry is CatalogFooterEntry => entry !== null);
}

const VALID_LAYOUT_TYPES = new Set(['qx', 'type2', 'type3']);

async function readCatalogContent(
  base: string,
): Promise<CatalogContentFiles | null> {
  const [
    hero,
    heroSliderFile,
    overview,
    gallery,
    finishes,
    dimensions,
    materials,
    features,
    gettingStarted,
    productCodes,
    packshots,
  ] = await Promise.all([
    readPublicJson<HeroData>(`${base}/hero/content.json`),
    readPublicJson<HeroSliderFile>(`${base}/hero/slider.json`),
    readPublicJson<OverviewData>(`${base}/overview/content.json`),
    readPublicJson<RawGalleryData>(`${base}/gallery/content.json`),
    readPublicJson<FinishesData>(`${base}/finishes/content.json`),
    readPublicJson<DimensionsData>(`${base}/dimensions/content.json`),
    readPublicJson<MaterialsData>(`${base}/materials/content.json`),
    readPublicJson<FeaturesData>(`${base}/features/content.json`),
    readPublicJson<GettingStartedData>(`${base}/getting-started/content.json`),
    readPublicJson<ProductCodesData>(`${base}/codes/content.json`),
    readPublicJson<RawPackshotsData>(`${base}/packshots/content.json`),
  ]);

  return hero &&
    overview &&
    gallery &&
    finishes &&
    dimensions &&
    materials &&
    features &&
    gettingStarted &&
    productCodes
    ? {
        hero,
        heroSliderFile,
        overview,
        gallery,
        finishes,
        dimensions,
        materials,
        features,
        gettingStarted,
        productCodes,
        packshots,
      }
    : null;
}

export async function loadCatalog(
  catalogId: string,
): Promise<CatalogData | null> {
  const base = catalogBase(catalogId);

  const config = await readPublicJson<CatalogConfig>(`${base}/config.json`);
  if (!config) return null;

  if (!config.meta?.layoutType || !VALID_LAYOUT_TYPES.has(config.meta.layoutType)) {
    console.warn(
      `[catalog-loader] ${catalogId}: missing or invalid meta.layoutType (got ${JSON.stringify(config.meta?.layoutType)}). Expected one of: qx, type2, type3.`,
    );
    return null;
  }

  const sections =
    config.sections ?? SECTION_ORDER.map((id) => ({ id, label: id }));

  const content = await readCatalogContent(base);
  if (!content) return null;

  const {
    hero,
    heroSliderFile,
    overview,
    gallery,
    finishes,
    dimensions,
    materials,
    features,
    gettingStarted,
    productCodes,
    packshots,
  } = content;

  parseHeroContent(hero);
  if (packshots) parsePackshotsContent(packshots);

  const heroBase = `${base}/hero`;
  const configuredSlides = await normalizeHeroSlides(
    heroSliderFile?.slides,
    heroBase,
    hero.heroImageAlt,
  );

  let heroSlides = configuredSlides;
  if (!heroSlides || heroSlides.length === 0) {
    const discoveredImages = await discoverHeroImages(heroBase);
    if (discoveredImages.length > 0) {
      heroSlides = discoveredImages.map((src, index, all) => ({
        src,
        alt: defaultHeroSlideAlt(hero.heroImageAlt, index, all.length),
      }));
    }
  }

  const sliderConfig = {
    ...(hero.slider ?? {}),
    ...(heroSliderFile?.settings ?? {}),
  };
  const descriptionStyle = {
    ...(hero.descriptionStyle ?? {}),
    ...(heroSliderFile?.descriptionStyle ?? {}),
  };
  const materialsBase = `${base}/materials`;
  const finishesBase = `${base}/finishes`;
  const [
    resolvedHeroImage,
    resolvedOverviewPackshot,
    resolvedPreviewImage,
    resolvedDetailImage,
    resolvedGalleryImages,
    resolvedPackshots,
    materialsConfigurator,
    finishesConfigurator,
  ] = await Promise.all([
    resolveImage(heroBase, hero.heroImage),
    resolveImage(`${base}/overview`, overview.packshotImage),
    resolveImage(finishesBase, finishes.previewImage),
    resolveImage(materialsBase, materials.detailImage),
    Promise.all(
      (gallery.images ?? []).map(async (img) => ({
        src: await resolveImage(`${base}/gallery`, img.image),
        alt: img.alt,
        category: img.category,
      })),
    ),
    packshots
      ? Promise.all(
          packshots.groups.map(async (group) => ({
            ...group,
            items: await Promise.all(
              group.items.map(async (item) => {
                const { image: _image, ...modelItem } = item as typeof item & {
                  image?: string;
                };

                return {
                  ...modelItem,
                  image: item.image
                    ? await resolveImage(`${base}/packshots`, item.image)
                    : undefined,
                  name: item.name?.trim() || buildPackshotName(group.model, item),
                };
              }),
            ),
          })),
        ).then((groups) => ({
          ...packshots,
          groups,
        }))
      : undefined,
    discoverMaterialsConfigurator(materialsBase, { includeShared: true }),
    discoverMaterialsConfigurator(finishesBase, { includeShared: true }),
  ]);

  return {
    id: catalogId,
    meta: config.meta,
    sections,
    hero: {
      ...hero,
      heroImage: resolvedHeroImage,
      heroSlides,
      heroImages: heroSlides?.map((slide) => slide.src),
      slider: Object.keys(sliderConfig).length > 0 ? sliderConfig : undefined,
      descriptionStyle:
        Object.keys(descriptionStyle).length > 0 ? descriptionStyle : undefined,
    },
    overview: {
      ...overview,
      packshotImage: resolvedOverviewPackshot,
    },
    gallery: {
      ...gallery,
      images: resolvedGalleryImages,
    },
    finishes: {
      ...finishes,
      previewImage: resolvedPreviewImage,
      ...(finishesConfigurator ? { configurator: finishesConfigurator } : {}),
    },
    dimensions,
    materials: {
      ...materials,
      detailImage: resolvedDetailImage,
      ...(materialsConfigurator ? { configurator: materialsConfigurator } : {}),
    },
    features,
    gettingStarted,
    productCodes,
    ...(resolvedPackshots ? { packshots: resolvedPackshots } : {}),
  };
}
