import Image from 'next/image';
import Link from 'next/link';

export const heroPills = [
  { src: '/images/opai-img-155.png', title: 'Websites', href: '/start-project' },
  { src: '/images/opai-img-156.png', title: 'Web Apps', href: '/start-project' },
  { src: '/images/opai-img-157.png', title: 'Custom Systems', href: '/start-project' },
];

export interface HeroPillProps {
  src: string;
  title: string;
  href: string;
}

const HeroPill = ({ src, title, href }: Readonly<HeroPillProps>) => (
  <Link href={href}>
    <figure className="group relative inline-block h-[90px] w-[220px] overflow-hidden rounded-[140px] lg:h-[120px] lg:w-[250px] xl:h-[150px] xl:w-[300px]">
      <Image
        src={src}
        alt={title}
        width={300}
        height={150}
        className="size-full object-cover transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-4"
      />
      <h3 className="font-instrument-serif md:text-is-heading-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-nowrap text-white/90 opacity-90 transition-opacity duration-300 ease-in-out group-hover:opacity-100">
        {title}
      </h3>
    </figure>
  </Link>
);

export default HeroPill;
