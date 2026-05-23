import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Image from 'next/image';

export interface GradientImgProps {
  imagePath: string;
  className?: string;
  alt?: string;
}

const GradientImg = ({ imagePath, className, alt = 'Top blend mode' }: GradientImgProps) => (
  <div className={cn(className)}>
    <Image
      src={imagePath}
      alt={alt}
      width={1920}
      height={696}
      priority
      className="size-full bg-no-repeat object-cover"
    />
  </div>
);

export default GradientImg;
