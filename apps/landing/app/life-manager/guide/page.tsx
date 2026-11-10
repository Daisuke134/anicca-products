import guide from '@/data/books/life-manager-ops-guide.json';
import LmOpsGuidePage, { lmOpsGuideMetadata } from '@/components/LmOpsGuidePage';

export const metadata = lmOpsGuideMetadata(guide);
export default function LifeManagerGuide() { return <LmOpsGuidePage guide={guide} />; }
