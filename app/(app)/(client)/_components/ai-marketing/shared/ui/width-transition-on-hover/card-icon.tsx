import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Image from 'next/image';

type CardIconProps = {
  src: string;
  alt: string;
  className?: string;
};

const CardIcon = ({ src, alt = 'card-icon', className }: CardIconProps) => {
  return (
    <figure className="size-13 rounded bg-white p-2.5">
      <Image
        src={src}
        alt={alt}
        width={52}
        height={52}
        className={cn('size-full object-contain', className)}
      />
    </figure>
  );
};

export default CardIcon;
