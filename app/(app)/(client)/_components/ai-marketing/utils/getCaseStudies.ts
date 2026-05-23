import type { CaseStudy, CaseStudyStat } from '@/app/(app)/(client)/_components/ai-marketing/interface';
import getMarkDownData from '@/app/(app)/(client)/_components/ai-marketing/utils/getMarkDownData';

export function getCaseStudies(): CaseStudy[] {
  return getMarkDownData('app/(app)/(client)/_components/ai-marketing/data/case-studies', true, 'date').map((item) => {
    const stats = Array.isArray(item.stats)
      ? (item.stats as unknown[]).map((s) => ({
          value: Number((s as { value?: number }).value ?? 0),
          suffix: String((s as { suffix?: string }).suffix ?? '%'),
          label: String((s as { label?: string }).label ?? ''),
        }))
      : undefined;
    return {
      slug: item.slug,
      title: typeof item.title === 'string' ? item.title : '',
      image: (() => {
        if (typeof item.image === 'string') return item.image;
        const mainImg = (item as unknown as { mainImg?: string }).mainImg;
        return typeof mainImg === 'string' ? mainImg : '';
      })(),
      excerpt: typeof item.excerpt === 'string' ? item.excerpt : '',
      stats: stats?.length ? (stats as CaseStudyStat[]) : undefined,
      client: typeof item.client === 'string' ? item.client : undefined,
      date: typeof item.date === 'string' ? item.date : undefined,
    };
  });
}
