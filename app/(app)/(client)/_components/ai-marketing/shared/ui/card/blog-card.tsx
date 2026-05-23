import { cn } from '@/app/(app)/(client)/_components/ai-marketing/utils/cn';
import Image from 'next/image';
import Link from 'next/link';
import { forwardRef } from 'react';

export type BlogCardProps = {
  card: {
    img: string;
    date: string;
    tags: string[];
    title: string;
    href: string;
  };
  className?: string;
};

const BlogCard = forwardRef<HTMLElement, BlogCardProps>(({ card, className }, ref) => (
  <article
    ref={ref}
    className={cn(
      'group underline-hover-effect-black relative min-h-[545px] w-full space-y-4',
      className
    )}
  >
    <Link href={card.href} className="block">
      <figure className="h-[380px] w-full overflow-hidden rounded-lg">
        <Image
          src={card.img}
          alt={card.title}
          width={380}
          height={380}
          quality={100}
          className="size-full object-cover transition-all duration-500 ease-in-out group-hover:scale-105 group-hover:rotate-2"
        />
      </figure>
    </Link>
    <div className="space-y-4 px-2">
      <p className="text-tagline-5 text-background-13/80 font-normal">{card.date}</p>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="bg-background-13/5 text-tagline-4 text-background-13/50 rounded-full px-3 py-1 font-normal"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link href={card.href} className="blog-title-black">
          <h3 className="text-is-heading-5 text-background-13 font-normal">{card.title}</h3>
        </Link>
      </div>
    </div>
  </article>
));

BlogCard.displayName = 'BlogCard';

export default BlogCard;
